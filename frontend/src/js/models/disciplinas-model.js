export const subjectColors = [
  { value: 'green', label: 'Verde' },
  { value: 'blue', label: 'Azul' },
  { value: 'pink', label: 'Rosa' },
  { value: 'gold', label: 'Amarelo' },
];

function normalizeName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function createSubject(subjects, input) {
  const name = String(input.name ?? '').trim().replace(/\s+/g, ' ');
  const color = input.color || 'green';
  const errors = {};
  if (!name || name.length > 100) errors.name = 'Informe um nome de 1 a 100 caracteres.';
  else if (subjects.some(subject => normalizeName(subject.name) === normalizeName(name))) {
    errors.name = 'Essa disciplina já está cadastrada.';
  }
  if (!subjectColors.some(option => option.value === color)) errors.color = 'Escolha uma cor disponível.';
  if (Object.keys(errors).length) return { errors };

  const subject = {
    id: subjects.reduce((max, item) => Math.max(max, item.id), 0) + 1,
    name, color,
  };
  subjects.push(subject);
  return { subject };
}

export function subjectSummary(subject, activities, today) {
  const pending = activities.filter(item => item.subject === subject.name && !item.done);
  const next = pending.filter(item => item.date >= today)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0] || null;
  return { pendingCount: pending.length, next };
}
