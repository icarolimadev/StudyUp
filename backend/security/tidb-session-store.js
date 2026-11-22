
import session from 'express-session';
import { getPool } from '../config/database.js';
import { sessionLifetime } from './session.js';

function expirationTime(data) {
  const expires = data.cookie?.expires;

  const timestamp = expires
    ? new Date(expires).getTime()
    : Date.now() + sessionLifetime;

  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) {
    throw new Error('Expiração de sessão inválida.');
  }

  return timestamp;
}

export class TiDBSessionStore extends session.Store {
  async get(sid, callback) {
    try {
      const [rows] = await getPool().execute(
        `SELECT dados, expira_em
         FROM sessoes
         WHERE session_id = ?`,
        [sid]
      );

      if (rows.length === 0) {
        return callback(null, null);
      }

      if (Number(rows[0].expira_em) <= Date.now()) {
        await getPool().execute(
          'DELETE FROM sessoes WHERE session_id = ?',
          [sid]
        );

        return callback(null, null);
      }

      callback(null, JSON.parse(rows[0].dados));
    } catch (error) {
      callback(error);
    }
  }

  async set(sid, data, callback) {
    try {
      await getPool().execute(
        `INSERT INTO sessoes
           (session_id, dados, expira_em)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           dados = VALUES(dados),
           expira_em = VALUES(expira_em)`,
        [
          sid,
          JSON.stringify(data),
          expirationTime(data)
        ]
      );

      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async destroy(sid, callback) {
    try {
      await getPool().execute(
        'DELETE FROM sessoes WHERE session_id = ?',
        [sid]
      );

      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async touch(sid, data, callback) {
    try {
      await getPool().execute(
        `UPDATE sessoes
         SET expira_em = ?
         WHERE session_id = ?`,
        [expirationTime(data), sid]
      );

      callback(null);
    } catch (error) {
      callback(error);
    }
  }
}
