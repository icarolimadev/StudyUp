import express from 'express';
import { fileURLToPath } from 'node:url';
import statusRoutes from './routes/status-routes.js';

// Configurar a aplicação não abre uma porta. server.js faz a inicialização.
const app = express();
app.disable('x-powered-by');
app.use('/api', statusRoutes);

app.use('/api', (request, response) => {
  response.status(404).json({ error: 'Rota da API não encontrada.' });
});

// Só frontend é público. O caminho absoluto independe da pasta de execução.
const frontendPath = fileURLToPath(new URL('../frontend/', import.meta.url));
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

export default app;
