export function requireLocalJson(request, response, next) {
  const origin = request.get('Origin');
  if (request.get('Sec-Fetch-Site') === 'cross-site'
      || (origin && origin !== `${request.protocol}://${request.get('host')}`)) {
    return response.status(403).json({ error: 'Origem da requisição não permitida.' });
  }
  if (!request.is('application/json')) return response.status(415).json({ error: 'Envie os dados em formato JSON.' });
  next();
}

export function handleJsonError(error, request, response, next) {
  if (error.type === 'entity.parse.failed') return response.status(400).json({ error: 'JSON inválido.' });
  if (error.status === 413) return response.status(413).json({ error: 'A requisição excedeu o tamanho permitido.' });
  next(error);
}
