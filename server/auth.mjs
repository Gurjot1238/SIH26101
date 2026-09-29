import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from './http.mjs';

const scryptAsync = promisify(scrypt);

const SCRYPT = {
  N: readIntEnv('SCRYPT_COST_N', 1 << 17, 1 << 12, 1 << 20),
  r: readIntEnv('SCRYPT_BLOCK_SIZE', 8, 1, 32),
  p: readIntEnv('SCRYPT_PARALLELISM', 1, 1, 8),
  keylen: 64,
};

function readIntEnv(name, fallback, min, max) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}, got "${raw}".`);
  }
  return value;
}

function maxmemFor(N, r) {
  return Math.max(64 * 1024 * 1024, 128 * N * r * 3);
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password.normalize('NFKC'), salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: maxmemFor(SCRYPT.N, SCRYPT.r),
  });
  return [
    'scrypt',
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$');
}

export async function verifyPassword(password, stored) {
  const parts = String(stored ?? '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![N, r, p].every(Number.isInteger) || N < 2 || N > 1 << 20 || r < 1 || r > 32 || p < 1 || p > 8) {
    return false;
  }

  let salt;
  let expected;
  try {
    salt = Buffer.from(parts[4], 'base64');
    expected = Buffer.from(parts[5], 'base64');
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = await scryptAsync(password.normalize('NFKC'), salt, expected.length, {
    N,
    r,
    p,
    maxmem: maxmemFor(N, r),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

let decoyHash = null;
export async function warmUp() {
  decoyHash = await hashPassword(randomBytes(24).toString('base64url'));
}

export async function burnTime(password) {
  if (!decoyHash) await warmUp();
  await verifyPassword(password, decoyHash);
  return false;
}

export const SESSION_COOKIE = 'sk_session';

export function newSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function fingerprintToken(token, secret) {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export function deriveSubkey(masterSecret, label) {
  return createHmac('sha256', String(masterSecret)).update(`nexora:subkey:${label}`).digest('hex');
}

export function newUserId() {
  return `usr_${randomUUID().replaceAll('-', '')}`;
}

const EMAIL_MAX = 254;
const EMAIL_PATTERN = /^[^\s@"'<>()[\],:;\\]+@[^\s@.,]+(\.[^\s@.,]+)+$/;
const PASSWORD_MIN = 10;
const PASSWORD_MAX = 200;
const NAME_MIN = 2;
const NAME_MAX = 80;

const OBVIOUS_PASSWORDS = new Set([
  'password', 'password1', 'password123', '1234567890', '12345678', '123456789',
  'qwertyuiop', 'letmein123', 'iloveyou1', 'admin12345', 'welcome123',
  'NEXORA AI1', 'changeme123', 'passw0rd123', 'abcd123456',
]);

function requireString(value, field, label) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'invalid_input', `${label} is required.`, {
      [field]: `${label} is required.`,
    });
  }
  return value;
}

function cleanText(value) {
  let out = '';
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code > 31 && code !== 127) out += char;
  }
  return out.trim();
}

function fieldError(field, message) {
  return new HttpError(400, 'invalid_input', message, { [field]: message });
}

export function validateEmail(value) {
  const email = cleanText(requireString(value, 'email', 'Email address')).toLowerCase();
  if (email === '') throw fieldError('email', 'Enter your email address.');
  if (email.length > EMAIL_MAX) throw fieldError('email', 'That email address is too long.');
  if (!EMAIL_PATTERN.test(email)) throw fieldError('email', 'Enter a valid email address.');
  return email;
}

export function validateName(value) {
  const name = cleanText(requireString(value, 'name', 'Full name'));
  if (name.length < NAME_MIN) throw fieldError('name', 'Enter your full name.');
  if (name.length > NAME_MAX) throw fieldError('name', `Keep your name under ${NAME_MAX} characters.`);
  return name;
}

export function validatePasswordPresent(value) {
  const password = requireString(value, 'password', 'Password');
  if (password === '') throw fieldError('password', 'Enter your password.');
  if (password.length > PASSWORD_MAX) throw fieldError('password', 'That password is too long.');
  return password;
}

export function validateNewPassword(value, { email = '', name = '' } = {}) {
  const password = validatePasswordPresent(value);
  if (password.length < PASSWORD_MIN) {
    throw fieldError('password', `Use at least ${PASSWORD_MIN} characters.`);
  }

  const lowered = password.toLowerCase();
  if (OBVIOUS_PASSWORDS.has(lowered)) {
    throw fieldError('password', 'That password is too common. Pick something else.');
  }

  const localPart = email.split('@')[0] ?? '';
  if (lowered === email.toLowerCase() || (localPart.length >= 4 && lowered.includes(localPart.toLowerCase()))) {
    throw fieldError('password', 'Your password cannot contain your email address.');
  }
  if (name.length >= 4 && lowered.includes(name.toLowerCase())) {
    throw fieldError('password', 'Your password cannot contain your name.');
  }
  return password;
}

export const PASSWORD_POLICY = { min: PASSWORD_MIN, max: PASSWORD_MAX };

export function createRateLimiter({ limit, windowMs, name }) {
  const hits = new Map();

  function prune(key, now) {
    const stamps = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
    if (stamps.length === 0) hits.delete(key);
    else hits.set(key, stamps);
    return stamps;
  }

  return {
    name,
    take(key) {
      if (limit <= 0) return null;
      const now = Date.now();
      const stamps = prune(key, now);
      if (stamps.length >= limit) {
        const retryMs = windowMs - (now - stamps[0]);
        return Math.max(1, Math.ceil(retryMs / 1000));
      }
      stamps.push(now);
      hits.set(key, stamps);
      return null;
    },
    peek(key) {
      if (limit <= 0) return null;
      const now = Date.now();
      const stamps = prune(key, now);
      if (stamps.length < limit) return null;
      return Math.max(1, Math.ceil((windowMs - (now - stamps[0])) / 1000));
    },
    clear(key) {
      hits.delete(key);
    },
    sweep() {
      const now = Date.now();
      for (const key of [...hits.keys()]) prune(key, now);
    },
    get size() {
      return hits.size;
    },
  };
}
