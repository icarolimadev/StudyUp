// Exemplos temporários. Este módulo não acessa o DOM nem persiste informações.
const zone = 'America/Fortaleza';

export function todayKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

// Meio-dia UTC permite calcular dias sem depender do fuso do computador.
export function shiftDay(key, amount) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function formatDay(key, options) {
  return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: zone })
    .format(new Date(`${key}T12:00:00Z`));
}

export function weekDays(today) {
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const monday = shiftDay(today, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftDay(monday, index));
}

export function createDemo(today) {
  return [
    { id: 1, type: 'tarefa', title: 'Finalizar relatório', subject: 'Desenvolvimento Web', date: today, time: '10:00', priority: 'Alta', done: false },
    { id: 2, type: 'tarefa', title: 'Estudar para a prova', subject: 'Física', date: today, time: '14:00', priority: 'Alta', done: false },
    { id: 3, type: 'tarefa', title: 'Revisar etapas do projeto', subject: 'Projeto Integrador', date: today, time: '19:00', priority: 'Média', done: true },
    { id: 4, type: 'prova', title: 'Prova de Matemática', subject: 'Matemática', date: today, time: '16:00', priority: 'Alta', done: false },
    { id: 5, type: 'projeto', title: 'Sistema Web', subject: 'Desenvolvimento Web', date: today, time: '18:00', priority: 'Média', done: false },
    { id: 6, type: 'projeto', title: 'Projeto Integrador', subject: 'Redes de Computadores', date: today, time: '20:00', priority: 'Média', done: false },
    { id: 7, type: 'evento', title: 'Grupo de estudos', subject: 'Física', date: today, time: '17:00', priority: 'Baixa', done: false },
    { id: 8, type: 'tarefa', title: 'Lista de exercícios', subject: 'Matemática', date: shiftDay(today, 1), time: '18:00', priority: 'Média', done: false },
    { id: 9, type: 'tarefa', title: 'Trabalho de Redes', subject: 'Redes de Computadores', date: shiftDay(today, 2), time: '12:00', priority: 'Alta', done: false },
    { id: 10, type: 'tarefa', title: 'Produção textual', subject: 'Português', date: shiftDay(today, 5), time: '09:00', priority: 'Baixa', done: false },
  ];
}

export function tasksOnDay(activities, day) {
  return activities.filter(item => item.type === 'tarefa' && item.date === day)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function upcoming(activities, today) {
  return activities.filter(item => !item.done && item.date >= today)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}
