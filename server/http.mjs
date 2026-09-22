/**
 * HTTP plumbing for the NEXORA AI auth server.
 *
 * Deliberately dependency-free: everything here uses only Node built-ins so
 * `npm install` is never required for the backend and there is no native
 * module that can fail to compile on Apple Silicon.
 */

/**
 * Hard cap on request bodies. Almost every payload this API accepts is small — an
 * auth form, or a quiz result carrying topic names and counts — so anything larger is
 * either a bug or abuse. Enforced twice below: once on the declared
 * Content-Length, once on the bytes actually read, because the header can lie.
 */
export const MAX_BODY_BYTES = 8 * 1024;

/**
 * The one exception: extracted document text on its way to AI question generation.
 *
 * Raised for that single route rather than globally, so a bug or an attack against
 * /api/auth/login still cannot post a megabyte. 256 KB comfortably holds the 60 000
 * characters the AI service will accept plus JSON escaping, and nothing more.
 */
export const MAX_AI_BODY_BYTES = 256 * 1024;

/** An error we are willing to describe to the client. Anything else becomes a 500. */
export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/**
 * Read and parse a JSON body.
 *
 * Requiring `application/json` is a deliberate CSRF control: a cross-site
 * HTML <form> cannot produce that content type, and a cross-site fetch that
 * sets it triggers a CORS preflight, which the origin allow-list rejects.
 */
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
    // Reject arrays and primitives so downstream code can assume an object.
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object');
    }
    return parsed;
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must be a JSON object.');
  }
}

/* ------------------------------------------------------------------ cookies */

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
  // HttpOnly keeps the token away from JavaScript, so an XSS bug cannot read it.
  if (options.httpOnly !== false) bits.push('HttpOnly');
  bits.push(`SameSite=${options.sameSite ?? 'Lax'}`);
  // Secure must be off on plain http://localhost or the browser drops the cookie.
  if (options.secure) bits.push('Secure');
  return bits.join('; ');
}

/* ---------------------------------------------------------------- responses */

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-site',
  'Cache-Control': 'no-store',
  // This is a JSON API and never renders HTML, so lock the policy right down.
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  // HSTS: browsers ignore this when it arrives over plain http (so it is a no-op on
  // localhost) and enforce https-only for a year once the site is served over https —
  // exactly the behaviour we want in production without breaking local development.
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

/* --------------------------------------------------------------------- CORS */

/**
 * Build the CORS headers for one request.
 *
 * The allow-list is exact-match only. `Access-Control-Allow-Origin: *` is never
 * used, because a wildcard is incompatible with credentialed requests and would
 * let any site on the internet call this API with the user's session cookie.
 */
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
    // DELETE is here for "clear my quiz history" and nothing else. An HTML form
    // cannot issue it, so it cannot be forged cross-site the way a POST can.
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
  });
}

/**
 * Second CSRF control, alongside the SameSite=Lax cookie and the JSON-only
 * body rule: if a browser sent an Origin header on a state-changing request,
 * it has to be one we trust. Requests with no Origin (curl, server-to-server)
 * are allowed through, since a browser always sends one on cross-site POSTs.
 */
export function assertTrustedOrigin(req, allowedOrigins) {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    throw new HttpError(403, 'origin_not_allowed', 'This origin is not allowed to call the API.');
  }
}

/** Best-effort client address, used only for rate limiting. */
export function clientKey(req, trustProxy) {
  if (trustProxy) {
    const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
    if (forwarded) return forwarded;
  }
  return req.socket.remoteAddress ?? 'unknown';
}
