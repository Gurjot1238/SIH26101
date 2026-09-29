export const MAX_BODY_BYTES = 8 * 1024;

export const MAX_AI_BODY_BYTES = 256 * 1024;

export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export async function readJsonBody(req, { maxBytes = MAX_BODY_BYTES } = {}) {
  const contentType = String(req.headers['content-type'] ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (contentType !== 'application/json') {
    throw new HttpError(
      415,
      'unsupported_media_type',
      'Send this request with Content-Type: application/json.',
    );
  }

  const declaredLength = Number(req.headers['content-length'] ?? Number.NaN);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(413, 'body_too_large', 'Request body is too large.');
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      throw new HttpError(413, 'body_too_large', 'Request body is too large.');
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (raw.trim() === '') return {};

  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object');
    }
    return parsed;
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must be a JSON object.');
  }
}

export function parseCookies(header) {
  const jar = Object.create(null);
  if (!header) return jar;

  for (const part of String(header).split(';')) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    const name = part.slice(0, eq).trim();
    if (!name) continue;
    try {
      jar[name] = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      jar[name] = part.slice(eq + 1).trim();
    }
  }
  return jar;
}

export function serializeCookie(name, value, options = {}) {
  const bits = [`${name}=${encodeURIComponent(value)}`];
  bits.push(`Path=${options.path ?? '/'}`);
  if (options.maxAge !== undefined) bits.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.httpOnly !== false) bits.push('HttpOnly');
  bits.push(`SameSite=${options.sameSite ?? 'Lax'}`);
  if (options.secure) bits.push('Secure');
  return bits.join('; ');
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-site',
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

export function sendJson(res, status, payload, extraHeaders = {}) {
  const body = Buffer.from(`${JSON.stringify(payload)}\n`, 'utf8');
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    ...extraHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
  });
  res.end(body);
}

export function sendEmpty(res, status, extraHeaders = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...extraHeaders, 'Content-Length': 0 });
  res.end();
}

export function corsHeaders(req, allowedOrigins) {
  const origin = req.headers.origin;
  if (!origin || !allowedOrigins.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

export function handlePreflight(req, res, allowedOrigins) {
  const headers = corsHeaders(req, allowedOrigins);
  if (!headers['Access-Control-Allow-Origin']) {
    sendEmpty(res, 403);
    return;
  }
  sendEmpty(res, 204, {
    ...headers,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
  });
}

export function assertTrustedOrigin(req, allowedOrigins) {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    throw new HttpError(403, 'origin_not_allowed', 'This origin is not allowed to call the API.');
  }
}

export function clientKey(req, trustProxy) {
  const hops = trustProxy === true ? 1
    : (Number.isInteger(trustProxy) && trustProxy > 0 ? trustProxy : 0);
  if (hops > 0) {
    const chain = String(req.headers['x-forwarded-for'] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (chain.length >= hops) {
      const candidate = chain[chain.length - hops];
      if (candidate) return candidate;
    }
  }
  return req.socket.remoteAddress ?? 'unknown';
}
