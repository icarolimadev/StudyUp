export function isAgendaDate(value) {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function agendaSlots(activities, day) {
  const items = activities.filter(item => item.date === day);
  // A faixa de referência é ampliada para incluir qualquer horário cadastrado.
  const times = new Set(['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']);
  items.forEach(item => times.add(item.time));
  return [...times].sort().map(time => ({
    time, activities: items.filter(item => item.time === time),
  }));
}
