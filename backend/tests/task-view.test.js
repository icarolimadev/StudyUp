import test from 'node:test';
import assert from 'node:assert/strict';
import { taskForView, filterSavedTasks, nowInFortaleza, isOverdue } from '../../frontend/src/js/models/task-view.js';
import { savedTasks, savedSubjects, loadWorkspace, saveTask } from '../../frontend/src/js/models/task-store.js';
const raw = { id: 1, title: 'Revisão de redes', description: null, subjectId: 10, subjectName: 'Redes', deadline: '2026-11-05T10:00:30', priority: 'alta', status: 'pendente', completedAt: null };
const defaults = { period: 'todas', query: '', subject: '', priority: '', status: '' };

test('adapta resposta real, preserva segundos e usa o horário de Fortaleza', () => {
  const task = taskForView(raw);
  assert.equal(task.time, '10:00:30'); assert.equal(task.priority, 'Alta'); assert.equal(task.subjectId, 10);
  assert.equal(taskForView({ ...raw, deadline: '2026-11-05T10:00:00' }).time, '10:00');
  assert.equal(nowInFortaleza(new Date('2026-11-06T02:00:00Z')), '2026-11-05T23:00:00');
  assert.equal(isOverdue(task, '2026-11-05T10:00:30'), false);
  assert.equal(isOverdue(task, '2026-11-05T10:00:31'), true);
});

test('combina filtros por ID, prioridade, estado, busca e período sem alterar a lista', () => {
  const tasks = [taskForView(raw), taskForView({ ...raw, id: 2, deadline: '2026-11-06T10:00:00', subjectId: 20, priority: 'baixa' }), taskForView({ ...raw, id: 3, status: 'concluida' }), taskForView({ ...raw, id: 4, deadline: '2026-11-13T10:00:00' })];
  const snapshot = JSON.stringify(tasks); const now = '2026-11-05T12:00:00';
  const ids = filters => filterSavedTasks(tasks, { ...defaults, ...filters }, now).map(item => item.id);
  assert.deepEqual(ids({ period: 'atrasadas' }), [1]);
  assert.deepEqual(ids({ period: 'proximas' }), [2]);
  assert.deepEqual(ids({ period: 'concluidas' }), [3]);
  assert.deepEqual(ids({ period: 'hoje', subject: '10', priority: 'Alta', status: 'pendente', query: 'revisao' }), [1]);
  assert.deepEqual(ids({ subject: '20', priority: 'Alta' }), []);
  assert.deepEqual(ids({ period: 'atrasadas', status: 'concluida' }), []);
  assert.equal(JSON.stringify(tasks), snapshot);
});

test('uma leitura antiga não sobrescreve uma gravação recente', async t => {
  savedTasks.splice(0); savedSubjects.splice(0);
  let resolveOld;
  let reads = 0;
  let serverTask = { ...raw };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url === '/api/disciplinas') return Response.json({ subjects: [{ id: 10, name: 'Redes' }] });
    if (options.method === 'PATCH') { serverTask = { ...serverTask, ...JSON.parse(options.body) }; return Response.json({ task: serverTask }); }
    reads += 1;
    if (reads === 1) return new Promise(resolve => { resolveOld = () => resolve(Response.json({ tasks: [raw] })); });
    return Response.json({ tasks: [serverTask] });
  });
  const loading = loadWorkspace();
  while (!resolveOld) await new Promise(resolve => setTimeout(resolve, 1));
  await saveTask(1, { title: 'Título novo' });
  resolveOld(); await loading;
  assert.equal(savedTasks[0].title, 'Título novo'); assert.equal(reads, 2);
});

test('falha de gravação preserva o estado e não bloqueia a próxima tentativa', async t => {
  savedTasks.splice(0, savedTasks.length, taskForView(raw));
  let attempts = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    if (++attempts === 1) throw new TypeError('offline');
    return Response.json({ task: { ...raw, status: 'concluida' } });
  });
  await assert.rejects(saveTask(1, { status: 'concluida' }));
  assert.equal(savedTasks[0].done, false);
  await saveTask(1, { status: 'concluida' }); assert.equal(savedTasks[0].done, true);
});

test('resposta de leitura mais antiga não substitui a consulta mais recente', async t => {
  const waiting = [];
  t.mock.method(globalThis, 'fetch', async url => {
    if (url === '/api/disciplinas') return Response.json({ subjects: [] });
    return new Promise(resolve => waiting.push(resolve));
  });
  const first = loadWorkspace();
  while (waiting.length < 1) await new Promise(resolve => setTimeout(resolve, 1));
  const second = loadWorkspace();
  while (waiting.length < 2) await new Promise(resolve => setTimeout(resolve, 1));
  waiting[1](Response.json({ tasks: [{ ...raw, title: 'Mais recente' }] }));
  await second;
  waiting[0](Response.json({ tasks: [raw] }));
  await first;
  assert.equal(savedTasks[0].title, 'Mais recente');
});
