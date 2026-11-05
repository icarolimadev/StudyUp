import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import app from '../app.js';

let server;
let baseUrl;

before(async () => {
  // Este teste verifica o HTTP sem depender de credenciais ou serviço MySQL.
  delete process.env.DB_NAME;
  delete process.env.DB_USER;
  delete process.env.DB_PASSWORD;
  // Porta zero: o sistema escolhe uma porta livre para os testes.
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('GET /api/status retorna JSON e informa banco não configurado', async () => {
  const response = await fetch(`${baseUrl}/api/status`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {
    application: 'StudyUp', status: 'ok', database: 'not_configured',
  });
});

test('o mesmo servidor entrega HTML, CSS e módulos do frontend', async () => {
  for (const [path, contentType, marker] of [
    ['/', /text\/html/, '<title>StudyUp</title>'],
    ['/views/pages/app.html', /text\/html/, 'id="disciplinas"'],
    ['/src/css/main.css', /text\/css/, 'disciplinas.css'],
    ['/src/js/layouts/app-layout.js', /javascript/, 'mountSubjects'],
  ]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), contentType);
    assert.ok((await response.text()).includes(marker), path);
  }
});

test('rotas desconhecidas e métodos não implementados não simulam sucesso', async () => {
  for (const [path, method] of [['/api/inexistente', 'GET'], ['/api/status', 'POST']]) {
    const response = await fetch(`${baseUrl}${path}`, { method });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Rota da API não encontrada.' });
  }
  const page = await fetch(`${baseUrl}/pagina-inexistente`);
  assert.equal(page.status, 404);
  assert.equal(await page.text(), 'Página não encontrada.');
});

test('arquivos internos do projeto não ficam públicos', async () => {
  for (const path of ['/backend/server.js', '/package.json', '/.env', '/.env.example', '/.git/config', '/docs/plano-mvp.md', '/node_modules/express/package.json']) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 404, path);
  }
});

test('server.js rejeita porta inválida sem anunciar sucesso', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../server.js', import.meta.url))], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: 'abc' }, encoding: 'utf8', timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /PORT deve ser/);
  assert.doesNotMatch(result.stdout, /disponível/);
});

test('server.js explica porta ocupada sem anunciar sucesso', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../server.js', import.meta.url))], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(server.address().port) }, encoding: 'utf8', timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /está ocupada/);
  assert.doesNotMatch(result.stdout, /disponível/);
});
