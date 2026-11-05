import session from 'express-session';
import { randomBytes, timingSafeEqual } from 'node:crypto';

export const cookieName = 'studyup.sid';
export const sessionLifetime = 2 * 60 * 60 * 1000;

// MemoryStore é somente para esta fase local. Reiniciar encerra as sessões.
export function createSessionMiddleware({ store, lifetime = sessionLifetime } = {}) {
  return session({
    name: cookieName,
    secret: randomBytes(32).toString('hex'),
    store,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: lifetime, path: '/' },
  });
}

export function sessionIsValid(request, { now = Date.now, lifetime = sessionLifetime } = {}) {
  return Number.isSafeInteger(request.session?.userId)
    && Number.isFinite(request.session.createdAt)
    && now() - request.session.createdAt >= 0
    && now() - request.session.createdAt < lifetime;
}

export async function destroySession(request, response) {
  await new Promise((resolve, reject) => request.session.destroy(error => error ? reject(error) : resolve()));
  response.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', secure: request.secure, path: '/' });
}

export function requireSession(settings) {
  return async (request, response, next) => {
    if (sessionIsValid(request, settings)) return next();
    await destroySession(request, response);
    return response.status(401).json({ error: 'Entre na sua conta para continuar.' });
  };
}

export function requireCsrf(request, response, next) {
  const received = request.get('X-CSRF-Token');
  const expected = request.session?.csrfToken;
  if (typeof received !== 'string' || typeof expected !== 'string'
      || !/^[a-f0-9]{64}$/.test(received)
      || !/^[a-f0-9]{64}$/.test(expected)
      || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    return response.status(403).json({ error: 'Recarregue a página antes de tentar novamente.' });
  }
  next();
}
