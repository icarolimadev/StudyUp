import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthResponseError, readAuthResponse } from '../../frontend/src/js/components/auth-response.js';

test('prévia estática não é confundida com falha de conexão ou cadastro bem-sucedido', async () => {
  for (const status of [200, 404, 405]) {
    const response = new Response('<html>File not found</html>', { status, headers: { 'Content-Type': 'text/html' } });
    await assert.rejects(readAuthResponse(response), error => error instanceof AuthResponseError && /endereço do servidor/.test(error.message));
  }
});

test('preserva respostas de sucesso e erros de validação da API', async () => {
  for (const [status, body] of [[201, { message: 'Conta criada' }], [409, { error: 'E-mail cadastrado', errors: { email: 'E-mail cadastrado' } }], [503, { error: 'Indisponível' }]]) {
    assert.deepEqual(await readAuthResponse(Response.json(body, { status })), body);
  }
});

test('JSON inválido recebe diagnóstico próprio e interrupções de rede são preservadas', async () => {
  for (const body of ['{', 'null', '[]', '"texto"']) {
    await assert.rejects(readAuthResponse(new Response(body, { headers: { 'Content-Type': 'application/json' } })), AuthResponseError);
  }
  const error = new TypeError('Conexão interrompida');
  await assert.rejects(readAuthResponse({ headers: new Headers({ 'Content-Type': 'application/json' }), json: async () => { throw error; } }), e => e === error);
});
