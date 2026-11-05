import { shiftDay } from './inicio-demo.js';

function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Validação da prévia. Na integração, o servidor também deverá validar tudo.
export function createTask(activities, input, allowedSubjects) {
  const title = String(input.title ?? '').trim();
  const description = String(input.description ?? '').trim();
  const subject = String(input.subject ?? '');
  const date = String(input.date ?? '');
  const time = String(input.time ?? '');
  const errors = {};
  if (!title || title.length > 150) errors.title = 'Informe um título de 1 a 150 caracteres.';
  if (description.length > 5000) errors.description = 'Use até 5.000 caracteres na descrição.';
  if (subject && !allowedSubjects.includes(subject)) errors.subject = 'Escolha uma disciplina disponível.';
  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date) errors.date = 'Informe uma data válida.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) errors.time = 'Informe um horário válido.';
  if (!['Baixa', 'Média', 'Alta'].includes(input.priority)) errors.priority = 'Escolha uma prioridade válida.';
  const reminderMinutes = input.reminderEnabled ? Number(input.reminderMinutes) : null;
  if (input.reminderEnabled && ![30, 60, 1440, 2880].includes(reminderMinutes)) {
    errors.reminderMinutes = 'Escolha uma antecedência disponível.';
  }
  if (Object.keys(errors).length) return { errors };

  const task = {
    id: activities.reduce((max, item) => Math.max(max, item.id), 0) + 1,
    type: 'tarefa', title, description, subject, date, time,
    priority: input.priority, done: false, reminderMinutes,
  };
  activities.push(task);
  return { task };
}

// Função sem DOM: combina filtros sem alterar a lista original.
export function filterTasks(activities, filters, today) {
  const query = normalize(filters.query.trim());
  return activities.filter(item => {
    if (item.type !== 'tarefa') return false;
    if (filters.period === 'hoje' && item.date !== today) return false;
    if (filters.period === 'proximas' &&
        (item.done || item.date <= today || item.date > shiftDay(today, 7))) return false;
    if (filters.period === 'concluidas' && !item.done) return false;
    if (filters.subject && item.subject !== filters.subject) return false;
    if (filters.priority && item.priority !== filters.priority) return false;
    return normalize(`${item.title} ${item.subject}`).includes(query);
  }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}
