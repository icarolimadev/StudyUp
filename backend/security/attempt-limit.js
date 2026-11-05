// Limite local por IP; não confia em X-Forwarded-For enviado pelo cliente.
export function createAttemptLimit({ limit = 10, windowMs = 15 * 60 * 1000, now = Date.now } = {}) {
  const attempts = new Map();
  return (request, response, next) => {
    const time = now();
    for (const [key, entry] of attempts) if (entry.until <= time) attempts.delete(key);
    const key = request.ip;
    if (!attempts.has(key)) {
      if (attempts.size >= 1000) return response.status(429).json({ error: 'Muitas tentativas. Aguarde e tente novamente.' });
      attempts.set(key, { count: 0, until: time + windowMs });
    }
    const entry = attempts.get(key);
    if (++entry.count > limit) {
      response.set('Retry-After', String(Math.ceil((entry.until - time) / 1000)));
      return response.status(429).json({ error: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.' });
    }
    next();
  };
}
