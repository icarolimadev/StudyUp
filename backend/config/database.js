import mysql from 'mysql2/promise';
import { isIP } from 'node:net';
import { readDatabaseTls, DatabaseConfigError } from './database-tls.js';

// Configuração separada permite testar entradas sem acessar um banco real.
export function readDatabaseConfig(env = process.env) {
  const ssl = readDatabaseTls(env);
  const production = env.NODE_ENV === 'production';
  const required = ['DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  if (!production && !ssl && required.every(key => !env[key])) return null;
  if (required.some(key => !env[key])) throw new DatabaseConfigError('Configuração MySQL incompleta.');
  const host = env.DB_HOST || '127.0.0.1';
  // mysql2 verifica identidade por nome DNS; não aceitar um IP no modo TLS.
  if (ssl && (!env.DB_HOST || isIP(host) || host.length > 253
      || !host.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)))) {
    throw new DatabaseConfigError('TLS exige DB_HOST com o hostname DNS do serviço MySQL.');
  }
  const portText = env.DB_PORT || '3306';
  const port = Number(portText);
  if (!/^\d+$/.test(portText) || port < 1 || port > 65535) throw new DatabaseConfigError('Porta MySQL inválida.');
  return {
    host, port,
    database: env.DB_NAME, user: env.DB_USER, password: env.DB_PASSWORD,
    waitForConnections: true, connectionLimit: 5, queueLimit: 20,
    connectTimeout: 5000, charset: 'utf8mb4', dateStrings: true,
    multipleStatements: false,
    ...(ssl ? { ssl } : {}),
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
