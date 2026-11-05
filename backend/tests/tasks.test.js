import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../app.js';
import { validateTask, parseTaskId } from '../validators/task-validator.js';
import { fortalezaDateTime, normalizeDeadline, withOverdue } from '../utils/task-dates.js';

const valid = { title: '  Revisar redes  ', deadline: '2030-05-20T14:30' };

async function setup(t, overrides = {}) {
  const records = [];
  let nextId = 1;
  const checkSubject = (userId, id) => { if (id !== null && id !== userId * 10) throw Object.assign(new Error('inválida'), { code: 'INVALID_SUBJECT' }); };
  const model = {
    listTasks: async userId => records.filter(item => item.owner === userId),
    createTask: async (userId, values, now) => {
      checkSubject(userId, values.subjectId);
      const task = { ...values, id: nextId++, owner: userId, completedAt: values.status === 'concluida' ? now : null };
      records.push(task); return task;
    },
    updateTask: async (userId, id, values, now) => {
      const task = records.find(item => item.owner === userId && item.id === id);
      if (!task) return null;
      checkSubject(userId, Object.hasOwn(values, 'subjectId') ? values.subjectId : task.subjectId);
      Object.assign(task, values);
      task.completedAt = task.status === 'concluida' ? task.completedAt || now : null;
      return task;
    },
    deleteTask: async (userId, id) => {
      const index = records.findIndex(item => item.owner === userId && item.id === id);
      if (index < 0) return false;
      records.splice(index, 1); return true;
    }, ...overrides,
  };
  const users = [{ id: 1, name: 'A', email: 'a@example.com' }, { id: 2, name: 'B', email: 'b@example.com' }];
  const app = createApp({ findByEmail: async email => users.find(user => user.email === email), findById: async id => users.find(user => user.id === id), verify: async () => true }, undefined, undefined, model);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, method = 'GET', body, account, headers = {}) => fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(account ? { Cookie: account.cookie, 'X-CSRF-Token': account.token } : {}), ...headers },
    ...(method === 'GET' ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body ?? {}) }),
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

test('validação de tarefa aplica padrões e preserva somente campos permitidos', () => {
  assert.deepEqual(validateTask(valid), { errors: {}, values: {
    title: 'Revisar redes', description: null, subjectId: null, deadline: '2030-05-20T14:30:00', priority: 'media', status: 'pendente',
  } });
  assert.deepEqual(validateTask({ status: 'concluida' }, true).values, { status: 'concluida' });
  assert.deepEqual(validateTask({ subjectId: null, description: null }, true).values, { subjectId: null, description: null });
  for (const body of [null, [], {}, { ...valid, title: ' ' }, { ...valid, title: 'x'.repeat(151) },
    { ...valid, description: 'x'.repeat(5001) }, { ...valid, description: 5 }, { ...valid, subjectId: '10' },
    { ...valid, subjectId: 0 }, { ...valid, priority: 'urgente' }, { ...valid, status: 'done' },
    { ...valid, usuario_id: 2 }, { ...valid, completedAt: '2030-01-01' }, { ...valid, overdue: false }]) {
    assert.ok(Object.keys(validateTask(body).errors).length, JSON.stringify(body).slice(0, 80));
  }
  assert.ok(Object.keys(validateTask({}, true).errors).length);
  for (const id of ['0', '-1', '1.5', '1x', '4294967296', '01']) assert.equal(parseTaskId(id), null);
  assert.equal(parseTaskId('4294967295'), 4294967295);
});

test('datas rejeitam dias inexistentes, fuso implícito e horários inválidos', () => {
  for (const date of ['2025-02-29T12:00', '2100-02-29T12:00', '2026-04-31T10:00', '2026-00-01T12:00', '2026-01-01T24:00', '2026-01-01T12:60', '2026-01-01T12:00:60', '2026-01-01T12:00Z', '2026-01-01T12:00-03:00', '2026-01-01', '0000-01-01T12:00', null]) assert.equal(normalizeDeadline(date), null, date);
  for (const date of ['2024-02-29T00:00:00', '2000-02-29T23:59:59', '1000-01-01T00:00:00', '9999-12-31T23:59:59']) assert.equal(normalizeDeadline(date), date);
});

test('virada do dia em Fortaleza e atraso dependem do prazo e estado', () => {
  assert.equal(fortalezaDateTime(new Date('2026-01-01T02:59:59Z')), '2025-12-31T23:59:59');
  assert.equal(fortalezaDateTime(new Date('2026-01-01T03:00:00Z')), '2026-01-01T00:00:00');
  const task = { status: 'pendente', deadline: '2026-01-01T00:00:00' };
  assert.equal(withOverdue(task, task.deadline).overdue, false);
  assert.equal(withOverdue(task, '2026-01-01T00:00:01').overdue, true);
  assert.equal(withOverdue({ ...task, status: 'concluida' }, '2026-01-02T00:00:00').overdue, false);
  assert.equal(withOverdue(task, '2025-12-31T23:59:59').overdue, false);
});

test('CRUD, conclusão e reabertura mantêm o dono e os campos omitidos', async t => {
  const { request, accounts: [a, b] } = await setup(t);
  const create = await request('/api/tarefas', 'POST', { ...valid, deadline: '2000-01-01T10:00', subjectId: 10 }, a);
  assert.equal(create.status, 201); const { task } = await create.json(); assert.equal(task.overdue, true);
  assert.deepEqual((await (await request('/api/tarefas?usuario_id=1', 'GET', undefined, b)).json()).tasks, []);
  for (const [method, body] of [['PATCH', { status: 'concluida' }], ['DELETE', {}]]) assert.equal((await request(`/api/tarefas/${task.id}`, method, body, b)).status, 404);
  const done = await request(`/api/tarefas/${task.id}`, 'PATCH', { status: 'concluida' }, a);
  assert.equal(done.status, 200); const completed = (await done.json()).task;
  assert.equal(completed.overdue, false); assert.ok(completed.completedAt); assert.equal(completed.title, task.title);
  const again = (await (await request(`/api/tarefas/${task.id}`, 'PATCH', { status: 'concluida' }, a)).json()).task;
  assert.equal(again.completedAt, completed.completedAt);
  const reopened = (await (await request(`/api/tarefas/${task.id}`, 'PATCH', { status: 'pendente', subjectId: null }, a)).json()).task;
  assert.equal(reopened.completedAt, null); assert.equal(reopened.overdue, true); assert.equal(reopened.subjectId, null);
  const list = await request('/api/tarefas', 'GET', undefined, a);
  assert.equal(list.headers.get('cache-control'), 'no-store'); assert.equal((await list.json()).tasks.length, 1);
  assert.equal((await request(`/api/tarefas/${task.id}`, 'DELETE', {}, a)).status, 204);
  assert.equal((await request(`/api/tarefas/${task.id}`, 'PATCH', { title: 'apagada' }, a)).status, 404);
});

test('recusa disciplina de outra conta e preserva tarefa após edição inválida', async t => {
  const { request, accounts: [a] } = await setup(t);
  assert.equal((await request('/api/tarefas', 'POST', { ...valid, subjectId: 20 }, a)).status, 400);
  const { task } = await (await request('/api/tarefas', 'POST', valid, a)).json();
  assert.equal((await request(`/api/tarefas/${task.id}`, 'PATCH', { subjectId: 20 }, a)).status, 400);
  const list = await (await request('/api/tarefas', 'GET', undefined, a)).json();
  assert.equal(list.tasks[0].subjectId, null);
});

test('sessão, CSRF, origem e validação protegem a API antes do model', async t => {
  const { request, accounts: [a, b], records } = await setup(t);
  assert.equal((await request('/api/tarefas')).status, 401);
  assert.equal((await request('/api/tarefas', 'POST', valid)).status, 401);
  for (const headers of [{ 'X-CSRF-Token': '' }, { 'X-CSRF-Token': b.token }, { Origin: 'https://outro.example' }]) assert.equal((await request('/api/tarefas', 'POST', valid, a, headers)).status, 403);
  assert.equal((await request('/api/tarefas', 'POST', { ...valid, usuario_id: 2 }, a)).status, 400);
  assert.equal((await request('/api/tarefas/1x', 'DELETE', {}, a)).status, 400);
  assert.equal((await request('/api/tarefas/1', 'PATCH', {}, a)).status, 400);
  assert.equal((await request('/api/tarefas', 'POST', '{', a)).status, 400);
  assert.equal((await request('/api/tarefas', 'POST', { ...valid, description: 'x'.repeat(45000) }, a)).status, 413);
  assert.equal(records.length, 0);
});

test('falha de banco e vínculo concorrente não expõem detalhes internos', async t => {
  const fail = code => async () => { throw Object.assign(new Error('SQL privado'), { code }); };
  const { request, accounts: [a] } = await setup(t, { listTasks: fail('ECONNREFUSED'), createTask: fail('ER_NO_REFERENCED_ROW_2') });
  const unavailable = await request('/api/tarefas', 'GET', undefined, a);
  assert.equal(unavailable.status, 503); assert.doesNotMatch(await unavailable.text(), /SQL|privado/);
  const invalid = await request('/api/tarefas', 'POST', valid, a);
  assert.equal(invalid.status, 400); assert.doesNotMatch(await invalid.text(), /SQL|privado/);
});
