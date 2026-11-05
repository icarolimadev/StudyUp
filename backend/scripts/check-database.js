import { getPool, getDatabaseStatus, closeDatabase } from '../config/database.js';

try {
  const status = await getDatabaseStatus();
  if (status !== 'connected') {
    console.error(status === 'not_configured'
      ? 'MySQL não configurado. Preencha DB_NAME, DB_USER e DB_PASSWORD no env/.env.'
      : 'Não foi possível conectar ao MySQL. Confira serviço, permissões e env/.env.');
    process.exitCode = 1;
  } else {
    const [rows] = await getPool().execute(
      'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()',
    );
    const missing = ['usuarios', 'disciplinas', 'tarefas'].filter(name => !rows.some(row => row.name === name));
    if (missing.length) {
      console.error(`Conexão OK; tabelas ausentes: ${missing.join(', ')}. Aplique backend/database/schema.sql.`);
      process.exitCode = 1;
    } else {
      console.log('Conexão MySQL OK. Tabelas usuarios, disciplinas e tarefas encontradas.');
    }
  }
} catch {
  console.error('Falha na verificação do banco. Confira a configuração e as permissões.');
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
