import app from './app.js';
import { getPool, closeDatabase } from './config/database.js';
import { DatabaseConfigError } from './config/database-tls.js';

const host = process.env.HOST || '127.0.0.1';
const portText = process.env.PORT || '3000';
const port = Number(portText);

if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT deve ser um número inteiro entre 1 e 65535.');
  process.exit(1);
}

// A criação do pool valida a configuração. SELECT 1 abre a conexão de verdade,
// incluindo a validação da cadeia e do hostname pelo mysql2, antes de servir HTTP.
if (process.env.NODE_ENV === 'production') {
  try {
    await getPool().execute({ sql: 'SELECT 1', timeout: 5000 });
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      // Esta classe contém somente mensagens controladas da configuração.
      console.error(`Falha na configuração MySQL: ${error.message}`);
    } else if (new Set([
      'HANDSHAKE_SSL_ERROR', 'HANDSHAKE_NO_SSL_SUPPORT',
      'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_HAS_EXPIRED',
      'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN',
      'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
    ]).has(error.code)) {
      console.error('Falha na validação TLS do MySQL. Confira CA, validade e DB_HOST.');
    } else {
      console.error('Não foi possível conectar ao MySQL na inicialização. Confira rede e credenciais.');
    }
    // Não imprimir mensagem/stack brutos do driver nem falhas de limpeza.
    try { await closeDatabase(); } catch {
      console.error('Não foi possível concluir o fechamento do pool MySQL.');
    }
    process.exit(1);
  }
}

const server = app.listen(port, host, async error => {
  // Express 5 também chama este callback quando a inicialização falha.
  if (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`A porta ${port} está ocupada. Encerre o outro servidor ou altere PORT.`);
    } else {
      console.error(`Não foi possível iniciar o servidor (${error.code || 'erro desconhecido'}).`);
    }
    process.exitCode = 1;
    // Em produção já pode existir uma conexão aberta pela verificação inicial.
    try { await closeDatabase(); } catch {
      console.error('Não foi possível concluir o fechamento do pool MySQL.');
    }
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
