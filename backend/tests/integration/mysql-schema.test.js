import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { disposableMysql, applyTestSql } from '../helpers/disposable-mysql.js';
import { inspectSchema, validateSchema } from '../../database/validate-schema.js';

const originalSql = await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8');
const migration = await readFile(new URL('../../database/migrations/001-initial.sql', import.meta.url), 'utf8');

test('migração 001 e validador em MySQL descartável', { timeout: 120000 }, async t => {
  const { connection: db, port } = await disposableMysql(t);
  await applyTestSql(db, originalSql);
  const original = await inspectSchema(db);
  let sequence = 0;
  async function fresh() {
    const name = `migration_test_${++sequence}`;
    await db.query(`CREATE DATABASE ${name} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
    await db.query(`USE ${name}`);
    await applyTestSql(db, migration);
    return name;
  }
  const migratedName = await fresh();

  await t.test('estrutura migrada é idêntica à original e à referência fixa', async () => {
    assert.deepEqual(await inspectSchema(db), original);
    assert.equal((await validateSchema(db)).valid, true);
  });
  await t.test('reaplicação falha e mantém a estrutura existente', async () => {
    await assert.rejects(applyTestSql(db, migration), { code: 'ER_TABLE_EXISTS_ERROR' });
    assert.deepEqual(await inspectSchema(db), original);
  });
  await t.test('constraints, unicidade e horário civil funcionam sem conversão de DATETIME', async () => {
    await db.beginTransaction();
    try {
      await db.query("INSERT INTO usuarios(id,nome,email,senha_hash) VALUES (100,'A','a@example.invalid','hash-teste'),(101,'B','b@example.invalid','hash-teste')");
      await assert.rejects(db.query("INSERT INTO usuarios(nome,email,senha_hash) VALUES ('C','a@example.invalid','hash-teste')"), { code: 'ER_DUP_ENTRY' });
      await db.query("INSERT INTO disciplinas(id,usuario_id,nome) VALUES (100,100,'Redes'),(101,101,'Redes')");
      await assert.rejects(db.query("INSERT INTO disciplinas(usuario_id,nome) VALUES (100,'Redes')"), { code: 'ER_DUP_ENTRY' });
      await assert.rejects(db.query("INSERT INTO tarefas(usuario_id,disciplina_id,titulo,data_limite) VALUES (100,101,'Inválida','2026-11-05 23:59:00')"), { code: 'ER_NO_REFERENCED_ROW_2' });
      await db.query("INSERT INTO tarefas(id,usuario_id,disciplina_id,titulo,data_limite) VALUES (100,100,100,'Teste','2026-11-05 23:59:00')");
      await assert.rejects(db.query('DELETE FROM disciplinas WHERE id=100'), { code: 'ER_ROW_IS_REFERENCED_2' });
      await assert.rejects(db.query("UPDATE tarefas SET status='concluida' WHERE id=100"), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
      await assert.rejects(db.query("UPDATE tarefas SET titulo='   ' WHERE id=100"), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
      for (const timezone of ['+00:00', '-03:00']) {
        await db.query('SET SESSION time_zone = ?', [timezone]);
        const [[row]] = await db.query('SELECT data_limite FROM tarefas WHERE id=100');
        assert.equal(row.data_limite, '2026-11-05 23:59:00');
      }
      assert.equal((await validateSchema(db)).valid, true, 'AUTO_INCREMENT alterado por dados não é divergência estrutural');
    } finally { await db.rollback(); }
  });

  for (const [name, sql] of [
    ['tamanho de coluna', 'ALTER TABLE usuarios MODIFY nome VARCHAR(149) NOT NULL'],
    ['índice removido', 'ALTER TABLE tarefas DROP INDEX ix_tarefas_usuario_prazo'],
    ['FK removida', 'ALTER TABLE tarefas DROP FOREIGN KEY fk_tarefas_disciplina_dono'],
    ['CHECK removido', 'ALTER TABLE tarefas DROP CHECK ck_tarefas_conclusao'],
    ['CHECK desativado', 'ALTER TABLE tarefas ALTER CHECK ck_tarefas_conclusao NOT ENFORCED'],
    ['collation diferente', 'ALTER TABLE usuarios CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin'],
    ['prazo convertido para TIMESTAMP', 'ALTER TABLE tarefas MODIFY data_limite TIMESTAMP NOT NULL'],
    ['tabela ausente', 'DROP TABLE tarefas'],
  ]) {
    await t.test(`detecta ${name}`, async () => {
      await fresh();
      await db.query(sql);
      assert.equal((await validateSchema(db)).valid, false);
    });
  }
  await t.test('tabela futura de sessões não invalida núcleo nem é aprovada implicitamente', async () => {
    await fresh();
    await db.query('CREATE TABLE sessoes (id INT PRIMARY KEY)');
    const result = await validateSchema(db);
    assert.equal(result.valid, true);
    assert.deepEqual(result.extraTables, ['sessoes']);
  });
  await t.test('charset do banco divergente é detectado mesmo com tabelas corretas', async () => {
    const name = await fresh();
    await db.query(`ALTER DATABASE ${name} CHARACTER SET latin1 COLLATE latin1_swedish_ci`);
    assert.equal((await validateSchema(db)).valid, false);
  });
  await t.test('CLI valida com usuário somente SELECT e não modifica registros', async () => {
    await db.query("CREATE USER 'schema_reader'@'localhost' IDENTIFIED BY 'private-test-password'");
    await db.query(`GRANT SELECT ON ${migratedName}.* TO 'schema_reader'@'localhost'`);
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('DB_') && !['NODE_ENV','NODE_OPTIONS'].includes(key)));
    async function runCli() {
      const child = spawn(process.execPath, [fileURLToPath(new URL('../../scripts/validate-database-schema.js', import.meta.url))], {
        env: { ...env, NODE_ENV: 'test', DB_HOST: '127.0.0.1', DB_PORT: String(port), DB_NAME: migratedName,
          DB_USER: 'schema_reader', DB_PASSWORD: 'private-test-password' }, stdio: ['ignore','pipe','pipe'],
      });
      let stdout=''; let stderr='';
      child.stdout.on('data', d=>stdout+=d); child.stderr.on('data', d=>stderr+=d);
      const watchdog = setTimeout(() => child.kill('SIGKILL'), 10000);
      try {
        const code = await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
        return { code, stdout, stderr };
      } finally { clearTimeout(watchdog); }
    }
    const { code, stdout, stderr } = await runCli();
    assert.equal(code,0,stderr);
    assert.match(stdout,/compatível/);
    assert.ok(!(stdout+stderr).includes('private-test-password'));
    await db.query(`USE ${migratedName}`);
    for (const table of ['usuarios','disciplinas','tarefas']) {
      const [[row]]=await db.query(`SELECT COUNT(*) AS total FROM ${table}`);
      assert.equal(row.total,0);
    }
    await db.query('ALTER TABLE usuarios MODIFY nome VARCHAR(149) NOT NULL');
    const rejected = await runCli();
    assert.equal(rejected.code,1);
    assert.match(rejected.stderr,/usuarios divergente/);
    assert.doesNotMatch(rejected.stdout,/compatível/);
    const [[column]] = await db.query("SELECT CHARACTER_MAXIMUM_LENGTH AS size FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='usuarios' AND COLUMN_NAME='nome'");
    assert.equal(column.size,149,'Validador deve reportar sem corrigir a tabela');
  });
});
