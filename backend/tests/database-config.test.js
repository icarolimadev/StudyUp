import test from 'node:test';
import assert from 'node:assert/strict';
import { readDatabaseConfig } from '../config/database.js';

test('sem credenciais, banco permanece não configurado', () => {
  assert.equal(readDatabaseConfig({}), null);
});

test('configuração parcial ou porta inválida é rejeitada', () => {
  assert.throws(() => readDatabaseConfig({ DB_NAME: 'studyup' }), /incompleta/);
  for (const port of ['abc', '0', '65536', '3306.5']) {
    assert.throws(() => readDatabaseConfig({ DB_NAME: 'test', DB_USER: 'test', DB_PASSWORD: 'test', DB_PORT: port }), /Porta/);
  }
});

test('configuração usa pool limitado, datas em texto e comandos múltiplos desativados', () => {
  const config = readDatabaseConfig({ DB_NAME: 'studyup', DB_USER: 'app', DB_PASSWORD: 'test-only' });
  assert.equal(config.port, 3306);
  assert.equal(config.multipleStatements, false);
  assert.equal(config.dateStrings, true);
  assert.equal(config.connectionLimit, 5);
});
