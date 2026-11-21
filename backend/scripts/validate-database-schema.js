import mysql from 'mysql2/promise';
import { readDatabaseConfig } from '../config/database.js';
import { DatabaseConfigError } from '../config/database-tls.js';
import { validateSchema } from '../database/validate-schema.js';

let connection;
try {
  // Exigir destino explícito: não assumir 127.0.0.1 nem carregar .env aqui.
  if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_NAME) {
    throw new DatabaseConfigError('Informe explicitamente DB_HOST, DB_PORT e DB_NAME para validar o destino.');
  }
  const config = readDatabaseConfig();
  if (!config) throw new DatabaseConfigError('Configuração MySQL ausente.');
  // Pool de uma conexão; todas as leituras usam o banco explícito da configuração.
  connection = mysql.createPool({ ...config, connectionLimit: 1 });
  const result = await validateSchema(connection);
  for (const error of result.errors) console.error(error);
  if (result.extraTables.length) console.log(`Aviso: ${result.extraTables.length} tabela(s) adicional(is) fora do contrato 001; não foram validadas.`);
  if (result.valid) console.log('Estrutura das três tabelas do núcleo compatível com a migração 001. Nenhum dado foi alterado.');
  else process.exitCode = 1;
} catch (error) {
  console.error(error instanceof DatabaseConfigError ? error.message
    : 'Não foi possível validar a estrutura. Confira conexão, TLS, permissões e referência do esquema.');
  process.exitCode = 1;
} finally {
  if (connection) {
    try { await connection.end(); } catch {
      console.error('Falha ao encerrar a conexão de validação.'); process.exitCode = 1;
    }
  }
}
