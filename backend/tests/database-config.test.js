import test from 'node:test';
import assert from 'node:assert/strict';
import { readDatabaseConfig } from '../config/database.js';
import { fileURLToPath } from 'node:url';

const credentials = { DB_NAME: 'studyup', DB_USER: 'app', DB_PASSWORD: 'test-only' };
const tls = {
  DB_TLS: 'true', DB_HOST: 'mysql.example.invalid',
  DB_CA_FILE: fileURLToPath(new URL('./fixtures/test-ca.pem', import.meta.url)),
};

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

test('configuração local preserva host padrão, senha literal e ausência de TLS', () => {
  for (const flag of [undefined, 'false']) {
    const config = readDatabaseConfig({ ...credentials, DB_TLS: flag, DB_PASSWORD: ' senha com espaços ' });
    assert.equal(config.host, '127.0.0.1');
    assert.equal(config.password, ' senha com espaços ');
    assert.equal(Object.hasOwn(config, 'ssl'), false);
  }
});

test('produção e TLS não permitem banco ausente ou parcial', () => {
  assert.throws(() => readDatabaseConfig({ NODE_ENV: 'production' }), /Produção exige/);
  for (const env of [tls, { ...tls, NODE_ENV: 'production' }, { ...tls, DB_NAME: 'studyup' }]) {
    assert.throws(() => readDatabaseConfig(env), /incompleta/);
  }
});

test('produção não aceita TLS desativado mesmo com credenciais', () => {
  assert.throws(() => readDatabaseConfig({ ...credentials, NODE_ENV: 'production', DB_TLS: 'false' }), /Produção exige/);
});

test('TLS rejeita IP, hostname ausente, URL e nome DNS inválido', () => {
  for (const host of [undefined, '', '127.0.0.1', '::1', 'https://mysql.example.com', 'nome com espaço', '-host', 'host.']) {
    assert.throws(() => readDatabaseConfig({ ...credentials, ...tls, DB_HOST: host }), /hostname DNS/);
  }
});

test('TLS local e produção recebem opções seguras preservando limites do pool', () => {
  for (const mode of ['development', 'production']) {
    const config = readDatabaseConfig({ ...credentials, ...tls, NODE_ENV: mode, DB_PORT: '12345' });
    assert.equal(config.host, tls.DB_HOST);
    assert.equal(config.port, 12345);
    assert.equal(config.ssl.rejectUnauthorized, true);
    assert.equal(config.ssl.verifyIdentity, true);
    assert.equal(config.multipleStatements, false);
    assert.equal(config.connectionLimit, 5);
    assert.equal(config.queueLimit, 20);
    assert.equal(config.dateStrings, true);
  }
});
