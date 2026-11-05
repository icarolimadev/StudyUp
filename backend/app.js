import express from 'express';
import { fileURLToPath } from 'node:url';
import statusRoutes from './routes/status-routes.js';
import { createAuthRoutes } from './routes/auth-routes.js';
import { createSubjectRoutes } from './routes/subject-routes.js';
import { createTaskRoutes } from './routes/task-routes.js';
import { posix } from 'node:path';
import { createSessionMiddleware, sessionIsValid } from './security/session.js';

// Configurar a aplicação não abre uma porta. server.js faz a inicialização.
export function createApp(authDependencies, sessionSettings, subjectModel, taskModel) {
  const app = express();
  app.disable('x-powered-by');
  app.use(createSessionMiddleware(sessionSettings));
  app.use('/api', statusRoutes);
  app.use('/api/auth', createAuthRoutes(authDependencies, sessionSettings));
  app.use('/api/disciplinas', createSubjectRoutes(sessionSettings, subjectModel));
  app.use('/api/tarefas', createTaskRoutes(sessionSettings, taskModel));

  app.use('/api', (request, response) => {
    response.status(404).json({ error: 'Rota da API não encontrada.' });
  });

  // Só frontend é público. O caminho absoluto independe da pasta de execução.
  const frontendPath = fileURLToPath(new URL('../frontend/', import.meta.url));
  // Conferir o caminho decodificado evita contornar a proteção com %61pp.html.
  app.use((request, response, next) => {
    let path;
    try { path = posix.normalize(decodeURIComponent(request.path)); }
    catch { return response.status(400).type('text').send('Endereço inválido.'); }
    if (path === '/views/pages/app.html') {
      response.set('Cache-Control', 'no-store');
      if (!sessionIsValid(request, sessionSettings)) return response.redirect('/views/pages/auth.html#auth-login');
    }
    next();
  });
  app.use(express.static(frontendPath, { dotfiles: 'ignore' }));

  app.use((request, response) => {
    response.status(404).type('text/plain').send('Página não encontrada.');
  });

  // O Express identifica tratamento de erro pelos quatro parâmetros.
  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    console.error('Falha ao atender requisição:', error.message);
    response.status(500).json({ error: 'Erro interno do servidor.' });
  });

  return app;
}

export default createApp();
