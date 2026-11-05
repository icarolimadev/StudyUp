import { Router, json } from 'express';
import { createTaskController } from '../controllers/task-controller.js';
import { requireSession, requireCsrf } from '../security/session.js';
import { requireLocalJson, handleJsonError } from '../security/json-request.js';

export function createTaskRoutes(sessionSettings, model) {
  const router = Router();
  const controller = createTaskController(model);
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); next(); });
  router.use(requireSession(sessionSettings));
  router.get('/', controller.list);
  // 5000 caracteres da descrição podem ocupar até 30 KiB se escapados em JSON.
  const write = [requireLocalJson, requireCsrf, json({ limit: '40kb' })];
  router.post('/', ...write, controller.save);
  router.patch('/:id', ...write, controller.save);
  router.delete('/:id', ...write, controller.remove);
  router.use(handleJsonError);
  return router;
}
