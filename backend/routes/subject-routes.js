import { Router, json } from 'express';
import { createSubjectController } from '../controllers/subject-controller.js';
import { requireSession, requireCsrf } from '../security/session.js';
import { requireLocalJson, handleJsonError } from '../security/json-request.js';

export function createSubjectRoutes(sessionSettings, model) {
  const router = Router();
  const controller = createSubjectController(model);
  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); next(); });
  router.use(requireSession(sessionSettings));
  router.get('/', controller.list);
  const write = [requireLocalJson, requireCsrf, json({ limit: '8kb' })];
  router.post('/', ...write, controller.save);
  router.patch('/:id', ...write, controller.save);
  router.delete('/:id', ...write, controller.remove);
  router.use(handleJsonError);
  return router;
}
