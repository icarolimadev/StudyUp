import mysql from 'mysql2/promise';

// Configuração separada permite testar entradas sem acessar um banco real.
export function readDatabaseConfig(env = process.env) {
  const required = ['DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  if (required.every(key => !env[key])) return null;
  if (required.some(key => !env[key])) throw new Error('Configuração MySQL incompleta.');
  const portText = env.DB_PORT || '3306';
  const port = Number(portText);
  if (!/^\d+$/.test(portText) || port < 1 || port > 65535) throw new Error('Porta MySQL inválida.');
  return {
    host: env.DB_HOST || '127.0.0.1', port,
    database: env.DB_NAME, user: env.DB_USER, password: env.DB_PASSWORD,
    waitForConnections: true, connectionLimit: 5, queueLimit: 20,
    connectTimeout: 5000, charset: 'utf8mb4', dateStrings: true,
    multipleStatements: false,
  };
}

let pool;

export function getPool() {
  if (!pool) {
    const config = readDatabaseConfig();
    if (!config) return null;
    pool = mysql.createPool(config);
  }
  return pool;
}

export async function getDatabaseStatus() {
  try {
    const database = getPool();
    if (!database) return 'not_configured';
    await database.execute('SELECT 1');
    return 'connected';
  } catch {
    // A API não expõe credenciais, host nem mensagens internas do MySQL.
    return 'unavailable';
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
