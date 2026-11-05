import { getPool } from '../config/database.js';

function database() {
  const pool = getPool();
  if (!pool) throw new Error('Banco não configurado.');
  return pool;
}

const columns = `t.id, t.titulo AS title, t.descricao AS description,
  t.disciplina_id AS subjectId, d.nome AS subjectName, t.data_limite AS deadline,
  t.prioridade AS priority, t.status, t.concluida_em AS completedAt`;
const tables = `tarefas t LEFT JOIN disciplinas d ON d.id = t.disciplina_id AND d.usuario_id = t.usuario_id`;
const publicTask = row => row ? {
  ...row, deadline: row.deadline.replace(' ', 'T'), completedAt: row.completedAt?.replace(' ', 'T') ?? null,
} : null;

export async function listTasks(userId) {
  const [rows] = await database().execute(`SELECT ${columns} FROM ${tables} WHERE t.usuario_id = ? ORDER BY t.data_limite, t.id`, [userId]);
  return rows.map(publicTask);
}

async function readTask(connection, userId, id) {
  const [rows] = await connection.execute(`SELECT ${columns} FROM ${tables} WHERE t.id = ? AND t.usuario_id = ?`, [id, userId]);
  return publicTask(rows[0]);
}

async function checkSubject(connection, userId, subjectId) {
  if (subjectId === null) return;
  const [rows] = await connection.execute('SELECT id FROM disciplinas WHERE id = ? AND usuario_id = ?', [subjectId, userId]);
  if (!rows.length) throw Object.assign(new Error('Disciplina indisponível.'), { code: 'INVALID_SUBJECT' });
  // Além desta checagem, a FK composta protege contra mudanças concorrentes.
}

async function transaction(operation) {
  const connection = await database().getConnection();
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export function createTask(userId, values, now) {
  return transaction(async connection => {
    await checkSubject(connection, userId, values.subjectId);
    const completedAt = values.status === 'concluida' ? now.replace('T', ' ') : null;
    const [result] = await connection.execute(`INSERT INTO tarefas
      (usuario_id, disciplina_id, titulo, descricao, data_limite, prioridade, status, concluida_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, values.subjectId, values.title, values.description, values.deadline.replace('T', ' '), values.priority, values.status, completedAt]);
    return readTask(connection, userId, result.insertId);
  });
}

export function updateTask(userId, id, values, now) {
  return transaction(async connection => {
    // Bloqueia a linha até o commit: edições simultâneas não sobrescrevem campos omitidos.
    const [rows] = await connection.execute(`SELECT titulo AS title, descricao AS description,
      disciplina_id AS subjectId, data_limite AS deadline, prioridade AS priority,
      status, concluida_em AS completedAt FROM tarefas WHERE id = ? AND usuario_id = ? FOR UPDATE`, [id, userId]);
    if (!rows.length) return null;
    const previous = publicTask(rows[0]);
    const task = { ...previous, ...values };
    await checkSubject(connection, userId, task.subjectId);
    // Repetir "concluida" preserva a primeira conclusão; reabrir limpa a data.
    const completedAt = task.status === 'concluida' ? previous.completedAt || now : null;
    await connection.execute(`UPDATE tarefas SET titulo = ?, descricao = ?, disciplina_id = ?,
      data_limite = ?, prioridade = ?, status = ?, concluida_em = ? WHERE id = ? AND usuario_id = ?`,
    [task.title, task.description, task.subjectId, task.deadline.replace('T', ' '), task.priority, task.status, completedAt?.replace('T', ' ') ?? null, id, userId]);
    return readTask(connection, userId, id);
  });
}

export async function deleteTask(userId, id) {
  const [result] = await database().execute('DELETE FROM tarefas WHERE id = ? AND usuario_id = ?', [id, userId]);
  return result.affectedRows > 0;
}
