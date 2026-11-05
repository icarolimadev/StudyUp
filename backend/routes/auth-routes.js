import { Router, json } from 'express';
import { createRegisterController, createLoginController, createMeController, logout } from '../controllers/auth-controller.js';
import { requireSession, requireCsrf } from '../security/session.js';
import { createAttemptLimit } from '../security/attempt-limit.js';
import { requireLocalJson, handleJsonError } from '../security/json-request.js';

export function createAuthRoutes(dependencies, sessionSettings) {
  const router = Router();
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });
  router.post('/register', createAttemptLimit({ limit: 5 }), requireLocalJson, json({ limit: '8kb' }), createRegisterController(dependencies));
  router.post('/login', requireLocalJson, createAttemptLimit(), json({ limit: '8kb' }), createLoginController(dependencies, sessionSettings));
  router.get('/me', requireSession(sessionSettings), createMeController(dependencies));
  router.post('/logout', requireLocalJson, requireSession(sessionSettings), requireCsrf, logout);
  router.use(handleJsonError);
  return router;
}
