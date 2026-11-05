import * as taskModel from '../models/task-model.js';
import { validateTask, parseTaskId } from '../validators/task-validator.js';
import { fortalezaDateTime, withOverdue } from '../utils/task-dates.js';

export function createTaskController(model = taskModel, now = fortalezaDateTime) {
  const missing = response => response.status(404).json({ error: 'Tarefa não encontrada.' });
  function fail(response, error) {
    if (error.code === 'INVALID_SUBJECT' || error.code === 'ER_NO_REFERENCED_ROW_2') {
      return response.status(400).json({ error: 'Escolha uma disciplina da sua conta ou nenhuma disciplina.', errors: { subjectId: 'Disciplina indisponível para esta conta.' } });
    }
    return response.status(503).json({ error: 'Não foi possível acessar as tarefas. Tente novamente.' });
  }
  return {
    async list(request, response) {
      try {
        const tasks = await model.listTasks(request.session.userId);
        const current = now();
        response.json({ tasks: tasks.map(task => withOverdue(task, current)) });
      } catch (error) { fail(response, error); }
    },
    async save(request, response) {
      const editing = request.method === 'PATCH';
      const id = editing ? parseTaskId(request.params.id) : null;
      if (editing && !id) return response.status(400).json({ error: 'Identificador de tarefa inválido.' });
      const { errors, values } = validateTask(request.body, editing);
      if (Object.keys(errors).length) return response.status(400).json({ error: 'Confira os campos da tarefa.', errors });
      try {
        const current = now();
        const task = editing
          ? await model.updateTask(request.session.userId, id, values, current)
          : await model.createTask(request.session.userId, values, current);
        if (!task) return missing(response);
        response.status(editing ? 200 : 201).json({ task: withOverdue(task, current) });
      } catch (error) { fail(response, error); }
    },
    async remove(request, response) {
      const id = parseTaskId(request.params.id);
      if (!id) return response.status(400).json({ error: 'Identificador de tarefa inválido.' });
      try {
        if (!await model.deleteTask(request.session.userId, id)) return missing(response);
        response.status(204).end();
      } catch (error) { fail(response, error); }
    },
  };
}
