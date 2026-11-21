import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import mysql from 'mysql2/promise';
import { unusedPort, pause } from './server-process.js';

// Instância independente: não usa .env, sudo, systemctl nem o socket padrão.
export async function disposableMysql(t) {
  const directory = await mkdtemp(join(tmpdir(), 'studyup-schema-test-'));
  const data = join(directory, 'data');
  const socketPath = join(directory, 'mysql.sock');
  const port = await unusedPort();
  const binary = process.env.MYSQLD_BINARY || '/usr/sbin/mysqld';
  let child;
  let exited;
  let connection;
  t.after(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      connection ??= await mysql.createConnection({ socketPath, user: 'root', connectTimeout: 1000 });
      await connection.query('SHUTDOWN');
      await exited;
    }
    if (connection) await connection.end().catch(() => {});
    await rm(directory, { recursive: true, force: true });
  });
  await mkdir(data);
  await promisify(execFile)(binary, ['--no-defaults', '--initialize-insecure', `--datadir=${data}`], { timeout: 60000 });
  child = spawn(binary, ['--no-defaults', `--datadir=${data}`, `--socket=${socketPath}`,
    `--pid-file=${join(directory, 'mysql.pid')}`, `--log-error=${join(directory, 'mysql.log')}`,
    '--bind-address=127.0.0.1', `--port=${port}`, '--mysqlx=OFF', '--skip-log-bin',
    '--tls-version=', '--innodb-buffer-pool-size=64M', '--max-connections=10'], { stdio: 'ignore' });
  exited = new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
  exited.catch(() => {});
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error('MySQL descartável encerrou antes de iniciar.');
    try {
      connection = await mysql.createConnection({ socketPath, user: 'root', dateStrings: true, connectTimeout: 500 });
      return { connection, port };
    } catch { await pause(150); }
  }
  throw new Error('MySQL descartável não iniciou no prazo.');
}

// Exclusivo destes scripts DDL simples de teste; não é um executor SQL genérico.
export async function applyTestSql(connection, text) {
  for (const sql of text.replace(/^[ \t]*--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean)) {
    await connection.query(sql);
  }
}
