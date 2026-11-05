import app from './app.js';
import { closeDatabase } from './config/database.js';

const host = process.env.HOST || '127.0.0.1';
const portText = process.env.PORT || '3000';
const port = Number(portText);

if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT deve ser um número inteiro entre 1 e 65535.');
  process.exit(1);
}

const server = app.listen(port, host, error => {
  // Express 5 também chama este callback quando a inicialização falha.
  if (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`A porta ${port} está ocupada. Encerre o outro servidor ou altere PORT.`);
    } else {
      console.error(`Não foi possível iniciar o servidor (${error.code || 'erro desconhecido'}).`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(`StudyUp disponível em http://${host}:${port}`);
  console.log(`Status da API: http://${host}:${port}/api/status`);
});

// Ctrl+C encerra o servidor e libera a porta.
function shutdown() {
  server.close(async () => {
    await closeDatabase();
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
