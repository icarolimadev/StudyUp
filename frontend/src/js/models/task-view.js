import { todayKey, shiftDay } from './inicio-demo.js';

export const priorityLabels = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
export const priorityValues = { Baixa: 'baixa', Média: 'media', Alta: 'alta' };

// A API usa nomes próprios do banco; esta adaptação mantém as telas simples.
export function taskForView(task) {
  return { ...task, type: 'tarefa', date: task.deadline.slice(0, 10),
    time: task.deadline.endsWith(':00') ? task.deadline.slice(11, 16) : task.deadline.slice(11), subject: task.subjectName || '',
    priority: priorityLabels[task.priority], done: task.status === 'concluida' };
}

export function nowInFortaleza(date = new Date()) {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Fortaleza',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(date);
  return `${todayKey(date)}T${time}`;
}

export function isOverdue(task, now = nowInFortaleza()) {
  return !task.done && task.deadline < now;
}

export function filterSavedTasks(tasks, filters, now = nowInFortaleza()) {
  const today = now.slice(0, 10);
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const query = normalize(filters.query.trim());
  return tasks.filter(task => {
    if (filters.period === 'hoje' && task.date !== today) return false;
    if (filters.period === 'proximas' && (task.done || task.date <= today || task.date > shiftDay(today, 7))) return false;
    if (filters.period === 'atrasadas' && !isOverdue(task, now)) return false;
    if (filters.period === 'concluidas' && !task.done) return false;
    if (filters.status === 'pendente' && task.done) return false;
    if (filters.status === 'concluida' && !task.done) return false;
    if (filters.subject && String(task.subjectId) !== filters.subject) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    return normalize(`${task.title} ${task.subject}`).includes(query);
  }).sort((a, b) => a.deadline.localeCompare(b.deadline) || a.id - b.id);
}
