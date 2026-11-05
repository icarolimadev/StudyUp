import * as subjectModel from '../models/subject-model.js';
import { validateSubject, parseSubjectId } from '../validators/subject-validator.js';

export function createSubjectController(model = subjectModel) {
  function fail(response, error) {
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'Você já tem uma disciplina com esse nome.', errors: { name: 'Você já tem uma disciplina com esse nome.' } });
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return response.status(409).json({ error: 'Esta disciplina tem tarefas vinculadas. Remova ou altere o vínculo das tarefas antes de excluí-la.' });
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return response.status(401).json({ error: 'Entre novamente na sua conta.' });
    return response.status(503).json({ error: 'Não foi possível acessar as disciplinas. Tente novamente.' });
  }
  const missing = response => response.status(404).json({ error: 'Disciplina não encontrada.' });
  return {
    async list(request, response) {
      try { response.json({ subjects: await model.listSubjects(request.session.userId) }); }
      catch (error) { fail(response, error); }
    },
    async save(request, response) {
      const editing = request.method === 'PATCH';
      const id = editing ? parseSubjectId(request.params.id) : null;
      if (editing && !id) return response.status(400).json({ error: 'Identificador de disciplina inválido.' });
      const { errors, values } = validateSubject(request.body, editing);
      if (Object.keys(errors).length) return response.status(400).json({ error: 'Confira os campos da disciplina.', errors });
      try {
        const subject = editing
          ? await model.updateSubject(request.session.userId, id, values)
          : await model.createSubject(request.session.userId, values);
        if (!subject) return missing(response);
        response.status(editing ? 200 : 201).json({ subject });
      } catch (error) { fail(response, error); }
    },
    async remove(request, response) {
      const id = parseSubjectId(request.params.id);
      if (!id) return response.status(400).json({ error: 'Identificador de disciplina inválido.' });
      try {
        if (!await model.deleteSubject(request.session.userId, id)) return missing(response);
        response.status(204).end();
      } catch (error) { fail(response, error); }
    },
  };
}
