import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { normalizeCreateTable, compareSchema, inspectSchema } from '../database/validate-schema.js';

const expected = JSON.parse(readFileSync(new URL('../database/migrations/001-expected-schema.json', import.meta.url), 'utf8'));

test('validador aceita a referência e ignora somente o próximo AUTO_INCREMENT', () => {
  const actual = structuredClone(expected);
  actual.definitions.usuarios = normalizeCreateTable(actual.definitions.usuarios.replace(') ENGINE=InnoDB', ') ENGINE=InnoDB AUTO_INCREMENT=123'));
  assert.equal(compareSchema(actual, expected).valid, true);
  assert.match(actual.definitions.usuarios, /NOT NULL AUTO_INCREMENT/);
});

test('validador detecta coluna, índice, FK, CHECK, engine e collation divergentes', () => {
  for (const [table, from, to] of [
    ['usuarios', 'varchar(150)', 'varchar(149)'],
    ['tarefas', 'ix_tarefas_usuario_prazo', 'indice_diferente'],
    ['tarefas', 'ON DELETE RESTRICT', 'ON DELETE CASCADE'],
    ['tarefas', "'pendente'", "'outro'"],
    ['usuarios', 'ENGINE=InnoDB', 'ENGINE=MyISAM'],
    ['usuarios', 'utf8mb4_0900_ai_ci', 'utf8mb4_bin'],
  ]) {
    const actual = structuredClone(expected);
    assert.ok(actual.definitions[table].includes(from), from);
    actual.definitions[table] = actual.definitions[table].replace(from, to);
    assert.equal(compareSchema(actual, expected).valid, false);
  }
});

test('validador rejeita tabela ausente e padrões de banco divergentes', () => {
  const actual = structuredClone(expected);
  delete actual.definitions.disciplinas;
  actual.schema.charset = 'latin1';
  actual.schema.collation = 'latin1_swedish_ci';
  assert.equal(compareSchema(actual, expected).errors.length, 3);
});

test('tabelas futuras não são validadas nem impedem verificar o núcleo 001', () => {
  const actual = structuredClone(expected);
  actual.extraTables = ['sessoes'];
  const result = compareSchema(actual, expected);
  assert.equal(result.valid, true);
  assert.deepEqual(result.extraTables, ['sessoes']);
});

test('inspeção sem banco selecionado falha antes de ler tabelas', async () => {
  await assert.rejects(inspectSchema({ query: async () => [[{ name: null }]] }), /Selecione explicitamente/);
});

test('migração não escolhe destino, não apaga dados e não esconde tabela existente', () => {
  const sql = readFileSync(new URL('../database/migrations/001-initial.sql', import.meta.url), 'utf8').replace(/^[ \t]*--.*$/gm, '');
  assert.doesNotMatch(sql, /(?:^|;)\s*(?:USE|DROP|TRUNCATE|DELETE|INSERT|UPDATE)\b|CREATE DATABASE|IF NOT EXISTS/i);
  assert.equal((sql.match(/CREATE TABLE /g) || []).length, 3);
});

test('CLI recusa destino implícito e configuração TLS inválida sem expor segredos', () => {
  const clean = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('DB_') && !['NODE_ENV', 'NODE_OPTIONS'].includes(key)));
  for (const [configuration, message] of [
    [{}, /Informe explicitamente DB_HOST/],
    [{ NODE_ENV: 'production', DB_HOST: 'example.invalid', DB_PORT: '3306', DB_NAME: 'test', DB_USER: 'private-user', DB_PASSWORD: 'private-password', DB_TLS: 'false' }, /Produção exige DB_TLS/],
  ]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/validate-database-schema.js', import.meta.url))], {
      env: { ...clean, ...configuration }, encoding: 'utf8', timeout: 5000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
    assert.doesNotMatch(result.stdout + result.stderr, /private-user|private-password/);
  }
});
