// Datas da API são horários civis de Fortaleza, sem conversão implícita do MySQL.
export function fortalezaDateTime(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

export function normalizeDeadline(value) {
  if (typeof value !== 'string') return null;
  const match = /^([1-9]\d{3})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = '00'] = match;
  const date = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second));
  if (date.getUTCFullYear() !== +year || date.getUTCMonth() + 1 !== +month
      || date.getUTCDate() !== +day || date.getUTCHours() !== +hour
      || date.getUTCMinutes() !== +minute || date.getUTCSeconds() !== +second) return null;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export function withOverdue(task, now) {
  return { ...task, overdue: task.status === 'pendente' && task.deadline < now };
}
