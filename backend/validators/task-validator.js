import { normalizeDeadline } from '../utils/task-dates.js';

export function parseTaskId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id <= 4294967295 ? id : null;
}

export function validateTask(body, partial = false) {
  const errors = {};
  const values = {};
  const allowed = ['title', 'description', 'subjectId', 'deadline', 'priority', 'status'];
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { errors: { form: 'Informe os campos da tarefa.' }, values };
  if (Object.keys(body).some(key => !allowed.includes(key))) errors.form = 'Envie apenas os campos editáveis da tarefa.';
  if (partial && !Object.keys(body).length) errors.form = 'Informe ao menos um campo para editar.';
  const check = key => !partial || Object.hasOwn(body, key);
  if (check('title')) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title || title.length > 150) errors.title = 'Informe um título de 1 a 150 caracteres.';
    else values.title = title;
  }
  if (check('description')) {
    const description = body.description ?? null;
    if (description !== null && (typeof description !== 'string' || description.length > 5000)) errors.description = 'Use até 5.000 caracteres na descrição.';
    else values.description = description;
  }
  if (check('subjectId')) {
    const id = body.subjectId ?? null;
    if (id !== null && (!Number.isSafeInteger(id) || id < 1 || id > 4294967295)) errors.subjectId = 'Escolha uma disciplina válida ou nenhuma disciplina.';
    else values.subjectId = id;
  }
  if (check('deadline')) {
    const deadline = normalizeDeadline(body.deadline);
    if (!deadline) errors.deadline = 'Informe uma data e horário válidos de Fortaleza (AAAA-MM-DDTHH:mm).';
    else values.deadline = deadline;
  }
  if (check('priority')) {
    const priority = body.priority === undefined ? 'media' : body.priority;
    if (!['baixa', 'media', 'alta'].includes(priority)) errors.priority = 'Escolha baixa, media ou alta.';
    else values.priority = priority;
  }
  if (check('status')) {
    const status = body.status === undefined ? 'pendente' : body.status;
    if (!['pendente', 'concluida'].includes(status)) errors.status = 'Escolha pendente ou concluida.';
    else values.status = status;
  }
  return { errors, values };
}
