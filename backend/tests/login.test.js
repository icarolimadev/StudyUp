import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../app.js';
import { hashPassword, verifyPassword } from '../security/password.js';
import { sessionLifetime } from '../security/session.js';

const password = 'Uma frase para entrar 123';
const users = [
  { id: 1, name: 'Conta A', email: 'a@example.com', passwordHash: 'hash-a' },
  { id: 2, name: 'Conta B', email: 'b@example.com', passwordHash: 'hash-b' },
];
const dependencies = {
  findByEmail: async email => users.find(user => user.email === email) || null,
  findById: async id => users.find(user => user.id === id) || null,
  verify: async (input, hash) => input === password && ['hash-a', 'hash-b'].includes(hash),
};

async function serve(t, overrides = {}, settings) {
  const server = createApp({ ...dependencies, ...overrides }, settings).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    get: (path, cookie) => fetch(base + path, { headers: cookie ? { Cookie: cookie } : {}, redirect: 'manual' }),
    post: (path, body, cookie, headers = {}) => fetch(base + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: JSON.stringify(body),
    }),
  };
}
const cookieOf = response => response.headers.get('set-cookie')?.split(';')[0];

test('verifica senha correta, incorreta e hash malformado sem aceitar parâmetros arbitrários', async () => {
  const hash = await hashPassword(password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('senha errada', hash), false);
  assert.equal(await verifyPassword(password, null), false);
  assert.equal(await verifyPassword(password, hash.replace('32768', '999999999')), false);
});

test('sem sessão: API recusa e HTML protegido redireciona inclusive caminho codificado', async t => {
  const api = await serve(t);
  const response = await api.get('/api/auth/me');
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  for (const path of ['/views/pages/app.html', '/views/pages/%61pp.html', '/views//pages/app.html']) {
    const page = await api.get(path);
    assert.equal(page.status, 302);
    assert.equal(page.headers.get('location'), '/views/pages/auth.html#auth-login');
  }
});

test('login cria cookie HttpOnly e me retorna apenas dados públicos da conta', async t => {
  const api = await serve(t);
  const login = await api.post('/api/auth/login', { email: ' A@EXAMPLE.COM ', password, userId: 2 });
  assert.equal(login.status, 200);
  const header = login.headers.get('set-cookie');
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Lax/);
  assert.match(header, /Path=\//);
  assert.match(header, /Expires=/);
  assert.doesNotMatch(header, /hash-a|example.com/);
  const me = await api.get('/api/auth/me', cookieOf(login));
  const data = await me.json();
  assert.deepEqual(data.user, { id: 1, name: 'Conta A', email: 'a@example.com' });
  assert.match(data.csrfToken, /^[a-f0-9]{64}$/);
  assert.ok(!(await login.text()).includes('passwordHash'));
  const page = await api.get('/views/pages/app.html', cookieOf(login));
  assert.equal(page.status, 200);
  assert.equal(page.headers.get('cache-control'), 'no-store');
});

test('senha errada e conta desconhecida têm a mesma resposta e não criam sessão', async t => {
  const api = await serve(t);
  const wrong = await api.post('/api/auth/login', { email: users[0].email, password: 'incorreta' });
  const unknown = await api.post('/api/auth/login', { email: 'ninguem@example.com', password });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(await wrong.json(), await unknown.json());
  assert.equal(wrong.headers.get('set-cookie'), null);
});

test('validação e falha de banco não revelam credenciais', async t => {
  const api = await serve(t, { findByEmail: async () => { throw new Error('SQL privado'); } });
  const invalid = await api.post('/api/auth/login', { email: [], password: {} });
  assert.equal(invalid.status, 400);
  const unavailable = await api.post('/api/auth/login', { email: users[0].email, password });
  assert.equal(unavailable.status, 503);
  assert.doesNotMatch(await unavailable.text(), /SQL|privado/);
});

test('duas contas mantêm sessões distintas e não aceitam ID indicado pelo cliente', async t => {
  const api = await serve(t);
  const a = await api.post('/api/auth/login', { email: users[0].email, password });
  const b = await api.post('/api/auth/login', { email: users[1].email, password });
  assert.notEqual(cookieOf(a), cookieOf(b));
  assert.equal((await (await api.get('/api/auth/me?userId=2', cookieOf(a))).json()).user.id, 1);
  assert.equal((await (await api.get('/api/auth/me', cookieOf(b))).json()).user.id, 2);
});

test('novo login renova sessão e invalida identificador anterior', async t => {
  const api = await serve(t);
  const first = await api.post('/api/auth/login', { email: users[0].email, password });
  const second = await api.post('/api/auth/login', { email: users[0].email, password }, cookieOf(first));
  assert.notEqual(cookieOf(first), cookieOf(second));
  assert.equal((await api.get('/api/auth/me', cookieOf(first))).status, 401);
  assert.equal((await api.get('/api/auth/me', cookieOf(second))).status, 200);
});

test('logout exige CSRF e origem válida, e invalida a sessão no servidor', async t => {
  const api = await serve(t);
  const login = await api.post('/api/auth/login', { email: users[0].email, password });
  const cookie = cookieOf(login);
  const { csrfToken } = await (await api.get('/api/auth/me', cookie)).json();
  assert.equal((await api.post('/api/auth/logout', {}, cookie)).status, 403);
  assert.equal((await api.post('/api/auth/logout', {}, cookie, { 'X-CSRF-Token': '0'.repeat(64) })).status, 403);
  assert.equal((await api.post('/api/auth/logout', {}, cookie, { 'X-CSRF-Token': csrfToken, Origin: 'https://outro.example' })).status, 403);
  assert.equal((await api.get('/api/auth/me', cookie)).status, 200);
  const logout = await api.post('/api/auth/logout', {}, cookie, { 'X-CSRF-Token': csrfToken });
  assert.equal(logout.status, 204);
  assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  assert.equal((await api.get('/api/auth/me', cookie)).status, 401);
});

test('token de outra sessão e cookie alterado não autorizam ações', async t => {
  const api = await serve(t);
  const a = await api.post('/api/auth/login', { email: users[0].email, password });
  const b = await api.post('/api/auth/login', { email: users[1].email, password });
  const { csrfToken } = await (await api.get('/api/auth/me', cookieOf(a))).json();
  assert.equal((await api.post('/api/auth/logout', {}, cookieOf(b), { 'X-CSRF-Token': csrfToken })).status, 403);
  assert.equal((await api.get('/api/auth/me', cookieOf(a) + 'alterado')).status, 401);
});

test('sessão expira no servidor e não sobrevive a uma nova instância', async t => {
  let clock = Date.now();
  const api = await serve(t, {}, { now: () => clock });
  const login = await api.post('/api/auth/login', { email: users[0].email, password });
  const another = await serve(t);
  assert.equal((await another.get('/api/auth/me', cookieOf(login))).status, 401);
  clock += sessionLifetime;
  assert.equal((await api.get('/api/auth/me', cookieOf(login))).status, 401);
});

test('conta removida invalida a sessão e banco indisponível não simula logout', async t => {
  let mode = 'normal';
  const api = await serve(t, { findById: async () => {
    if (mode === 'offline') throw new Error('Banco indisponível');
    return mode === 'deleted' ? null : users[0];
  } });
  const login = await api.post('/api/auth/login', { email: users[0].email, password });
  mode = 'offline';
  assert.equal((await api.get('/api/auth/me', cookieOf(login))).status, 503);
  mode = 'normal';
  assert.equal((await api.get('/api/auth/me', cookieOf(login))).status, 200);
  mode = 'deleted';
  assert.equal((await api.get('/api/auth/me', cookieOf(login))).status, 401);
});

test('limite de tentativas bloqueia excesso de login por IP', async t => {
  const api = await serve(t);
  for (let i = 0; i < 10; i++) assert.equal((await api.post('/api/auth/login', { email: users[0].email, password: 'errada' })).status, 401);
  const blocked = await api.post('/api/auth/login', { email: users[0].email, password });
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
});

test('login rejeita origem externa e conteúdo diferente de JSON', async t => {
  const api = await serve(t);
  assert.equal((await api.post('/api/auth/login', {}, null, { Origin: 'https://outro.example' })).status, 403);
  assert.equal((await api.post('/api/auth/login', {}, null, { 'Content-Type': 'text/plain' })).status, 415);
});
