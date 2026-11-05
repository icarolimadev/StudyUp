import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { createApp } from '../app.js';
import { hashPassword } from '../security/password.js';
import { validateRegistration } from '../validators/register-validator.js';

const valid = { name: ' Estudante Teste ', email: ' TESTE@example.com ', password: 'Uma frase de teste 123', password_confirmation: 'Uma frase de teste 123' };

test('cadastro bloqueia a sexta tentativa antes do hash e ignora IP forjado', async t => {
  let hashes = 0;
  let writes = 0;
  const post = await serve(t, {
    hash: async () => { hashes++; return 'hash'; },
    saveUser: async () => { writes++; },
  });
  for (let i = 0; i < 5; i++) assert.equal((await post()).status, 201);
  const blocked = await post(valid, { 'X-Forwarded-For': '203.0.113.99' });
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  assert.equal(hashes, 5);
  assert.equal(writes, 5);
});

test('cadastro conta JSON inválido no limite de tentativas', async t => {
  const post = await serve(t, { hash: () => assert.fail('Não deve calcular hash') });
  for (let i = 0; i < 5; i++) assert.equal((await post('{')).status, 400);
  assert.equal((await post()).status, 429);
});

async function serve(t, dependencies) {
  const server = createApp(dependencies).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  return (body = valid, headers = {}) => fetch(`http://127.0.0.1:${server.address().port}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

test('cadastro normaliza nome/email, mas preserva a senha e rejeita entradas inválidas', () => {
  assert.deepEqual(validateRegistration(valid).values, { name: 'Estudante Teste', email: 'teste@example.com', password: valid.password });
  for (const body of [null, [], {}, { ...valid, name: ' ' }, { ...valid, name: 'x'.repeat(151) },
    { ...valid, email: {} }, { ...valid, email: 'sem-arroba' }, { ...valid, password: 'curta' },
    { ...valid, password: 'x'.repeat(129) }, { ...valid, password_confirmation: 'diferente' }]) {
    assert.ok(Object.keys(validateRegistration(body).errors).length);
  }
});

test('hash usa salt aleatório e pode ser recalculado sem guardar senha pura', async () => {
  const first = await hashPassword(valid.password);
  const second = await hashPassword(valid.password);
  assert.notEqual(first, second);
  assert.ok(first.length <= 255);
  assert.ok(!first.includes(valid.password));
  const [algorithm, N, r, p, salt, key] = first.split('$');
  assert.equal(algorithm, 'scrypt');
  const calculated = await promisify(scrypt)(valid.password, salt, 64, { N: +N, r: +r, p: +p, maxmem: 64 * 1024 * 1024 });
  assert.equal(calculated.toString('hex'), key);
});

test('HTTP rejeita campos inválidos antes de calcular hash ou gravar', async t => {
  const post = await serve(t, { hash: () => assert.fail('Não deve calcular hash'), saveUser: () => assert.fail('Não deve gravar') });
  const response = await post({ ...valid, name: ' ' });
  assert.equal(response.status, 400);
  assert.ok((await response.json()).errors.name);
});

test('HTTP grava só os campos permitidos e retorna 201 sem credenciais ou sessão', async t => {
  let saved;
  const post = await serve(t, { hash: async () => 'hash-protegido', saveUser: async user => { saved = user; } });
  const response = await post({ ...valid, id: 99, admin: true, senha_hash: 'injetado' });
  assert.equal(response.status, 201);
  assert.deepEqual(saved, { name: 'Estudante Teste', email: 'teste@example.com', passwordHash: 'hash-protegido' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.deepEqual(Object.keys(await response.json()), ['message']);
});

test('HTTP distingue e-mail duplicado de banco indisponível sem revelar SQL', async t => {
  for (const [code, status] of [['ER_DUP_ENTRY', 409], ['ECONNREFUSED', 503]]) {
    const post = await serve(t, { hash: async () => 'hash', saveUser: async () => { throw Object.assign(new Error('SQL e detalhes privados'), { code }); } });
    const response = await post();
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /SQL|privados/);
  }
});

test('HTTP rejeita origem externa, formulário comum, JSON quebrado e corpo grande', async t => {
  const post = await serve(t, { hash: () => assert.fail('Não deve calcular hash') });
  for (const [body, headers, status] of [
    [valid, { Origin: 'https://outro.example' }, 403],
    [valid, { 'Sec-Fetch-Site': 'cross-site' }, 403],
    ['name=teste', { 'Content-Type': 'application/x-www-form-urlencoded' }, 415],
    ['{', {}, 400],
    [{ ...valid, extra: 'a'.repeat(9000) }, {}, 413],
  ]) assert.equal((await post(body, headers)).status, status);
});

test('limita hashes simultâneos e libera capacidade após concluir', async t => {
  const pending = [];
  const post = await serve(t, { hash: () => new Promise(resolve => pending.push(resolve)), saveUser: async () => {} });
  const first = post();
  const second = post();
  try {
    for (let i = 0; i < 100 && pending.length < 2; i++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(pending.length, 2);
    const blocked = await post();
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get('retry-after'), '3');
  } finally {
    pending.forEach(resolve => resolve('hash'));
    assert.equal((await first).status, 201);
    assert.equal((await second).status, 201);
  }
  const third = post();
  for (let i = 0; i < 100 && pending.length < 3; i++) await new Promise(resolve => setTimeout(resolve, 10));
  pending[2]('hash');
  assert.equal((await third).status, 201);
});
