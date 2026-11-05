import { accountRequest } from '../components/account-session.js';
import { taskForView } from './task-view.js';

export const savedTasks = [];
export const savedSubjects = [];
let revision = 0;
let readRevision = 0;
let writes = Promise.resolve();

export async function loadWorkspace() {
  await writes;
  const reading = ++readRevision;
  const version = revision;
  const [tasks, subjects] = await Promise.all([
    accountRequest('/api/tarefas'), accountRequest('/api/disciplinas'),
  ]);
  if (reading !== readRevision) return;
  // Não substituir uma gravação recente por uma leitura iniciada antes dela.
  if (version !== revision) return loadWorkspace();
  savedTasks.splice(0, savedTasks.length, ...tasks.tasks.map(taskForView));
  savedSubjects.splice(0, savedSubjects.length, ...subjects.subjects);
}

function write(operation) {
  revision += 1;
  const result = writes.then(operation).finally(() => { revision += 1; });
  // Uma falha não impede a próxima tentativa; quem chamou ainda recebe o erro.
  writes = result.catch(() => {});
  return result;
}

export function saveTask(id, body) {
  return write(async () => {
    const { task } = await accountRequest(id ? `/api/tarefas/${id}` : '/api/tarefas', { method: id ? 'PATCH' : 'POST', body });
    const value = taskForView(task);
    const index = savedTasks.findIndex(item => item.id === value.id);
    if (index < 0) savedTasks.push(value); else savedTasks.splice(index, 1, value);
    return value;
  });
}

export function removeTask(id) {
  return write(async () => {
    await accountRequest(`/api/tarefas/${id}`, { method: 'DELETE' });
    const index = savedTasks.findIndex(task => task.id === id);
    if (index >= 0) savedTasks.splice(index, 1);
  });
}

export function taskError(error) {
  return ['TypeError', 'TimeoutError', 'SyntaxError'].includes(error.name)
    ? 'Não foi possível confirmar a operação. Confira sua conexão e atualize os dados antes de tentar novamente.' : error.message;
}
