import { shiftDay } from './inicio-demo.js';

export function createNotificationDemo(today) {
  return [
    { id: 1, type: 'tarefa', title: 'Prazo próximo', message: 'O trabalho de Redes tem entrega prevista em dois dias.', date: today, time: '10:00', read: false },
    { id: 2, type: 'tarefa', title: 'Lembrete de estudo', message: 'Reserve um momento para revisar o conteúdo de Física.', date: today, time: '09:40', read: false },
    { id: 3, type: 'projeto', title: 'Etapas do projeto', message: 'Confira as próximas etapas do Sistema Web.', date: today, time: '09:00', read: false },
    { id: 4, type: 'tarefa', title: 'Atividade concluída', message: 'Exemplo de aviso de conclusão de uma atividade de estudo.', date: shiftDay(today, -1), time: '18:32', read: true },
    { id: 5, type: 'evento', title: 'Encontro de estudos', message: 'Confira a organização do seu grupo de estudos.', date: shiftDay(today, -1), time: '14:00', read: true },
    { id: 6, type: 'prova', title: 'Preparação para a prova', message: 'Revise os conteúdos previstos para a prova de Matemática.', date: shiftDay(today, -7), time: '08:00', read: true },
  ];
}

export function notificationGroups(notifications, type, today) {
  const filtered = notifications.filter(item => type === 'todas' || item.type === type)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const yesterday = shiftDay(today, -1);
  return [
    { label: 'Hoje', items: filtered.filter(item => item.date === today) },
    { label: 'Ontem', items: filtered.filter(item => item.date === yesterday) },
    { label: 'Anteriores', items: filtered.filter(item => item.date < yesterday) },
  ].filter(group => group.items.length);
}

export function markNotificationRead(notifications, id) {
  const notification = notifications.find(item => item.id === id);
  if (!notification) return false;
  notification.read = true;
  return true;
}

export function markAllNotificationsRead(notifications) {
  const changed = notifications.filter(item => !item.read).length;
  notifications.forEach(item => { item.read = true; });
  return changed;
}

export function defaultNotificationPreferences() {
  return { tasks: true, exams: true, projects: true, events: false, deadlines: true, advanceDays: 2 };
}

export function saveNotificationPreferences(preferences, input) {
  const errors = {};
  const next = {};
  for (const key of ['tasks', 'exams', 'projects', 'events', 'deadlines']) {
    if (typeof input[key] !== 'boolean') errors[key] = 'Escolha ativar ou desativar esta preferência.';
    next[key] = input[key];
  }
  const days = Number(input.advanceDays);
  if (![1, 2, 3, 7].includes(days)) errors.advanceDays = 'Escolha uma antecedência disponível.';
  if (Object.keys(errors).length) return { errors };
  Object.assign(preferences, next, { advanceDays: days });
  return { saved: true };
}
