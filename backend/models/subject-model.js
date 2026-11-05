import { getPool } from '../config/database.js';

function database() {
  const pool = getPool();
  if (!pool) throw new Error('Banco não configurado.');
  return pool;
}

export async function listSubjects(userId) {
  const [rows] = await database().execute(`
    SELECT d.id, d.nome AS name, d.cor AS color,
      (SELECT COUNT(*) FROM tarefas t WHERE t.usuario_id = d.usuario_id
        AND t.disciplina_id = d.id AND t.status = 'pendente') AS pendingCount
    FROM disciplinas d WHERE d.usuario_id = ? ORDER BY d.nome, d.id`, [userId]);
  return rows.map(row => ({ ...row, color: row.color || 'green', pendingCount: Number(row.pendingCount) }));
}

export async function createSubject(userId, { name, color }) {
  const [result] = await database().execute('INSERT INTO disciplinas (usuario_id, nome, cor) VALUES (?, ?, ?)', [userId, name, color]);
  return { id: result.insertId, name, color, pendingCount: 0 };
}

export async function updateSubject(userId, id, values) {
  // Identificadores SQL vêm desta lista fixa; entradas do usuário são parâmetros.
  const fields = [['name', 'nome'], ['color', 'cor']].filter(([key]) => Object.hasOwn(values, key));
  await database().execute(`UPDATE disciplinas SET ${fields.map(([, column]) => `${column} = ?`).join(', ')} WHERE id = ? AND usuario_id = ?`,
    [...fields.map(([key]) => values[key]), id, userId]);
  // Consulta também cobre edição sem alteração de valor e registro inexistente.
  const [rows] = await database().execute('SELECT id, nome AS name, cor AS color FROM disciplinas WHERE id = ? AND usuario_id = ?', [id, userId]);
  return rows[0] || null;
}

export async function deleteSubject(userId, id) {
  // A FK impede excluir uma disciplina vinculada, inclusive em requisições simultâneas.
  const [result] = await database().execute('DELETE FROM disciplinas WHERE id = ? AND usuario_id = ?', [id, userId]);
  return result.affectedRows > 0;
}
