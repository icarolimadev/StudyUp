import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { launchServer, unusedPort, portIsClosed } from './helpers/server-process.js';

const configured = {
  NODE_ENV: 'production', DB_TLS: 'true', DB_HOST: 'localhost',
  DB_CA_FILE: fileURLToPath(new URL('./fixtures/test-ca.pem', import.meta.url)),
  DB_NAME: 'test', DB_USER: 'private-user-marker', DB_PASSWORD: 'private-password-marker',
};

async function expectFailure(server, port) {
  assert.deepEqual(await server.exited, { code: 1, signal: null });
  assert.doesNotMatch(server.stdout, /disponível|Status da API/);
  assert.equal(await portIsClosed(port), true);
  const logs = server.stdout + server.stderr;
  for (const secret of [configured.DB_USER, configured.DB_PASSWORD, 'BEGIN CERTIFICATE', 'PRIVATE-RAW-ERROR']) {
    assert.ok(!logs.includes(secret), 'Logs devem omitir credenciais e dados brutos');
  }
}

test('modo local inicia sem banco configurado e atende HTTP', async t => {
  const port = await unusedPort();
  const server = launchServer(t, { PORT: String(port) });
  await server.ready();
  const response = await fetch(`http://127.0.0.1:${port}/api/status`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).database, 'not_configured');
});

for (const [name, overrides, message] of [
  ['TLS desligado', { DB_TLS: 'false' }, /Produção exige DB_TLS=true/],
  ['credenciais incompletas', { DB_PASSWORD: '' }, /Configuração MySQL incompleta/],
  ['CA ausente', { DB_CA_FILE: '' }, /TLS exige DB_CA_FILE/],
  ['CA ilegível', { DB_CA_FILE: '/inexistente/private-password-marker.pem' }, /Não foi possível ler/],
]) {
  test(`produção não abre HTTP com ${name}`, async t => {
    const port = await unusedPort();
    const server = launchServer(t, { ...configured, ...overrides, PORT: String(port) });
    await expectFailure(server, port);
    assert.match(server.stderr, message);
  });
}

test('banco indisponível encerra o processo sem porta HTTP nem credenciais nos logs', async t => {
  const port = await unusedPort();
  const dbPort = await unusedPort();
  const server = launchServer(t, { ...configured, PORT: String(port), DB_PORT: String(dbPort) });
  await expectFailure(server, port);
  assert.match(server.stderr, /Não foi possível conectar ao MySQL na inicialização/);
});

test('porta HTTP continua fechada enquanto aguarda a conexão MySQL', async t => {
  const sockets = new Set();
  const fakeDatabase = createServer(socket => { sockets.add(socket); socket.on('error', () => {}); });
  fakeDatabase.listen(0, '127.0.0.1'); await once(fakeDatabase, 'listening');
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => fakeDatabase.close(resolve));
  });
  const connected = once(fakeDatabase, 'connection');
  const port = await unusedPort();
  const server = launchServer(t, { ...configured, PORT: String(port), DB_PORT: String(fakeDatabase.address().port) });
  await connected;
  assert.equal(await portIsClosed(port), true);
  assert.doesNotMatch(server.stdout, /disponível/);
  for (const socket of sockets) socket.destroy();
  await expectFailure(server, port);
});

test('erro bruto do protocolo MySQL não vaza conteúdo no log da inicialização', async t => {
  const fakeDatabase = createServer(socket => {
    socket.on('error', () => {});
    const payload = Buffer.concat([
      Buffer.from([0xff, 0x15, 0x04]),
      Buffer.from(`#28000PRIVATE-RAW-ERROR ${configured.DB_PASSWORD} ${configured.DB_USER}`),
    ]);
    const header = Buffer.alloc(4); header.writeUIntLE(payload.length, 0, 3);
    socket.end(Buffer.concat([header, payload]));
  });
  fakeDatabase.listen(0, '127.0.0.1'); await once(fakeDatabase, 'listening');
  t.after(() => new Promise(resolve => fakeDatabase.close(resolve)));
  const port = await unusedPort();
  const server = launchServer(t, { ...configured, PORT: String(port), DB_PORT: String(fakeDatabase.address().port) });
  await expectFailure(server, port);
  assert.match(server.stderr, /Confira rede e credenciais/);
});
