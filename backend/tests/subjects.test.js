import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../app.js';
import { validateSubject, parseSubjectId } from '../validators/subject-validator.js';

async function setup(t, overrides = {}) {
  const records = [];
  let nextId = 1;
  const owned = (userId, id) => records.find(item => item.owner === userId && item.id === id);
  const model = {
    listSubjects: async userId => records.filter(item => item.owner === userId),
    createSubject: async (userId, values) => { const item = { id: nextId++, owner: userId, ...values }; records.push(item); return item; },
    updateSubject: async (userId, id, values) => { const item = owned(userId, id); return item ? Object.assign(item, values) : null; },
    deleteSubject: async (userId, id) => { const index = records.indexOf(owned(userId, id)); if (index < 0) return false; records.splice(index, 1); return true; },
    ...overrides,
  };
  const users = [{ id: 1, name: 'A', email: 'a@example.com' }, { id: 2, name: 'B', email: 'b@example.com' }];
  const app = createApp({ findByEmail: async email => users.find(user => user.email === email), findById: async id => users.find(user => user.id === id), verify: async () => true }, undefined, model);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, method = 'GET', body, account, headers = {}) => fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(account ? { Cookie: account.cookie, 'X-CSRF-Token': account.token } : {}), ...headers },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body ?? {}) }),
  });
  const accounts = [];
  for (const user of users) {
    const response = await request('/api/auth/login', 'POST', { email: user.email, password: 'teste' });
    const cookie = response.headers.get('set-cookie').split(';')[0];
    const me = await request('/api/auth/me', 'GET', undefined, { cookie, token: '' });
    accounts.push({ cookie, token: (await me.json()).csrfToken });
  }
  return { request, accounts, records };
}

test('valida nomes, cores, campos extras, PATCH parcial e identificadores', () => {
  assert.deepEqual(validateSubject({ name: '  Redes   I ' }).values, { name: 'Redes I', color: 'green' });
  assert.deepEqual(validateSubject({ color: 'blue' }, true).values, { color: 'blue' });
  for (const body of [null, [], {}, { name: ' ' }, { name: 'a'.repeat(101) }, { name: 'Teste', color: 'inexistente' }, { name: 'Teste', usuario_id: 2 }]) assert.ok(Object.keys(validateSubject(body).errors).length);
  assert.ok(Object.keys(validateSubject({}, true).errors).length);
  for (const id of ['0','-1','1.5','1x','4294967296']) assert.equal(parseSubjectId(id), null);
  assert.equal(parseSubjectId('1'), 1);
});

test('CRUD usa a sessão e impede alteração/exclusão por outra conta', async t => {
  const { request, accounts: [a, b] } = await setup(t);
  const created = await request('/api/disciplinas', 'POST', { name: 'Redes' }, a);
  assert.equal(created.status, 201); const { subject } = await created.json();
  const list = await request('/api/disciplinas', 'GET', undefined, a);
  assert.equal(list.headers.get('cache-control'), 'no-store');
  assert.equal((await list.json()).subjects.length, 1);
  assert.deepEqual((await (await request('/api/disciplinas?usuario_id=1', 'GET', undefined, b)).json()).subjects, []);
  for (const method of ['PATCH', 'DELETE']) assert.equal((await request(`/api/disciplinas/${subject.id}`, method, { name: 'Invadida' }, b)).status, 404);
  assert.equal((await request(`/api/disciplinas/${subject.id}`, 'PATCH', { color: 'blue' }, a)).status, 200);
  assert.equal((await request(`/api/disciplinas/${subject.id}`, 'DELETE', {}, a)).status, 204);
  assert.equal((await request(`/api/disciplinas/${subject.id}`, 'DELETE', {}, a)).status, 404);
});

test('sessão, CSRF e origem são obrigatórios nas escritas', async t => {
  const { request, accounts: [a, b] } = await setup(t);
  assert.equal((await request('/api/disciplinas')).status, 401);
  assert.equal((await request('/api/disciplinas', 'POST', { name: 'Teste' })).status, 401);
  for (const headers of [{ 'X-CSRF-Token': '' }, { 'X-CSRF-Token': b.token }, { Origin: 'https://outro.example' }]) assert.equal((await request('/api/disciplinas', 'POST', { name: 'Teste' }, a, headers)).status, 403);
});

test('campos inválidos e tentativa de definir dono são rejeitados antes de gravar', async t => {
  const { request, accounts: [a], records } = await setup(t);
  for (const body of [{ name: ' ' }, { name: 'Teste', color: 'errada' }, { name: 'Teste', usuario_id: 2 }]) assert.equal((await request('/api/disciplinas', 'POST', body, a)).status, 400);
  assert.equal(records.length, 0);
  assert.equal((await request('/api/disciplinas/abc', 'PATCH', { name: 'Teste' }, a)).status, 400);
});

test('duplicidade, vínculo e falha de banco têm mensagens seguras', async t => {
  const fail = code => async () => { throw Object.assign(new Error('SQL privado'), { code }); };
  const { request, accounts: [a] } = await setup(t, { createSubject: fail('ER_DUP_ENTRY'), deleteSubject: fail('ER_ROW_IS_REFERENCED_2'), listSubjects: fail('ECONNREFUSED') });
  const duplicate = await request('/api/disciplinas', 'POST', { name: 'Teste' }, a);
  assert.equal(duplicate.status, 409);
  const linked = await request('/api/disciplinas/1', 'DELETE', {}, a);
  assert.equal(linked.status, 409); assert.match((await linked.json()).error, /tarefas vinculadas/);
  const unavailable = await request('/api/disciplinas', 'GET', undefined, a);
  assert.equal(unavailable.status, 503); assert.doesNotMatch(await unavailable.text(), /SQL|privado/);
});
