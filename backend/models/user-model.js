import { getPool } from '../config/database.js';

export async function insertUser({ name, email, passwordHash }) {
  const database = getPool();
  if (!database) throw new Error('Banco não configurado.');
  // Valores são parâmetros, nunca partes do texto SQL.
  const [result] = await database.execute(
    'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash],
  );
  return { id: result.insertId, name, email };
}

export async function findUserByEmail(email) {
  const database = getPool();
  if (!database) throw new Error('Banco não configurado.');
  const [rows] = await database.execute(
    'SELECT id, nome AS name, email, senha_hash AS passwordHash FROM usuarios WHERE email = ? LIMIT 1', [email],
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const database = getPool();
  if (!database) throw new Error('Banco não configurado.');
  const [rows] = await database.execute('SELECT id, nome AS name, email FROM usuarios WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}
