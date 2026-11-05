export function validateSubject(body, partial = false) {
  const errors = {};
  const values = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { errors: { form: 'Informe os campos da disciplina.' }, values };
  if (Object.keys(body).some(key => !['name', 'color'].includes(key))) errors.form = 'Envie apenas nome e cor da disciplina.';
  if (!partial || Object.hasOwn(body, 'name')) {
    const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
    if (!name || name.length > 100) errors.name = 'Informe um nome de 1 a 100 caracteres.';
    else values.name = name;
  }
  if (!partial || Object.hasOwn(body, 'color')) {
    const color = body.color === undefined ? 'green' : body.color;
    if (!['green', 'blue', 'pink', 'gold'].includes(color)) errors.color = 'Escolha uma cor disponível.';
    else values.color = color;
  }
  if (partial && !Object.keys(body).length) errors.form = 'Informe ao menos um campo para editar.';
  return { errors, values };
}

export function parseSubjectId(value) {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id <= 4294967295 ? id : null;
}
