import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { X509Certificate } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readDatabaseTls, DatabaseConfigError } from '../config/database-tls.js';

const caPath = fileURLToPath(new URL('./fixtures/test-ca.pem', import.meta.url));
const ca = readFileSync(caPath, 'utf8');
const certificate = new X509Certificate(ca);
const validTime = certificate.validFromDate.getTime() + 60_000;
const enabled = { DB_TLS: 'true', DB_CA_FILE: caPath };
const options = { now: () => validTime };

test('TLS local é opcional e não lê arquivo quando desativado', () => {
  const readFile = () => assert.fail('Não deve ler CA');
  assert.equal(readDatabaseTls({}, { readFile }), undefined);
  assert.equal(readDatabaseTls({ DB_TLS: 'false' }, { readFile }), undefined);
});

test('DB_TLS aceita apenas true e false em texto', () => {
  for (const value of ['', 'yes', '1', 'TRUE', true, false]) {
    assert.throws(() => readDatabaseTls({ DB_TLS: value }), DatabaseConfigError);
  }
});

test('produção rejeita TLS ausente ou desativado', () => {
  for (const flag of [undefined, 'false']) {
    assert.throws(() => readDatabaseTls({ NODE_ENV: 'production', DB_TLS: flag }), /Produção exige/);
  }
});

test('CA configurada com TLS desligado é erro, inclusive valor vazio', () => {
  for (const path of ['', 'arquivo.pem']) {
    assert.throws(() => readDatabaseTls({ DB_CA_FILE: path }), /não está ativado/);
  }
});

test('TLS exige caminho não vazio para a CA', () => {
  for (const path of [undefined, '', '   ']) {
    assert.throws(() => readDatabaseTls({ DB_TLS: 'true', DB_CA_FILE: path }), /TLS exige DB_CA_FILE/);
  }
});

test('falhas de leitura não expõem caminho nem erro do sistema', () => {
  for (const code of ['ENOENT', 'EACCES', 'EISDIR']) {
    assert.throws(() => readDatabaseTls(enabled, {
      readFile: () => { throw Object.assign(new Error('detalhe-privado'), { code }); },
    }), error => error instanceof DatabaseConfigError
      && error.message === 'Não foi possível ler o arquivo indicado em DB_CA_FILE.');
  }
});

test('CA vazia, texto, chave privada e lixo junto ao PEM são rejeitados', () => {
  for (const pem of ['', 'texto', '-----BEGIN PRIVATE KEY-----\nteste\n-----END PRIVATE KEY-----', ca + 'lixo']) {
    assert.throws(() => readDatabaseTls(enabled, { ...options, readFile: () => pem }), /somente certificados PEM/);
  }
});

test('PEM com conteúdo malformado é rejeitado sem revelar conteúdo', () => {
  assert.throws(() => readDatabaseTls(enabled, {
    readFile: () => '-----BEGIN CERTIFICATE-----\nnao-e-certificado\n-----END CERTIFICATE-----',
  }), error => error.message === 'DB_CA_FILE contém um certificado malformado.');
});

test('certificado de servidor não pode substituir uma CA', () => {
  const pem = readFileSync(new URL('./fixtures/test-leaf.pem', import.meta.url), 'utf8');
  assert.throws(() => readDatabaseTls(enabled, { ...options, readFile: () => pem }), /não é de CA/);
});

test('CA vencida ou ainda não válida é rejeitada usando relógio controlado', () => {
  for (const time of [certificate.validFromDate.getTime() - 1, certificate.validToDate.getTime() + 1]) {
    assert.throws(() => readDatabaseTls(enabled, { now: () => time }), /fora do período/);
  }
});

test('CA real é lida do arquivo com cadeia, identidade e versão TLS exigidas', () => {
  const ssl = readDatabaseTls({ ...enabled, NODE_ENV: 'production' }, options);
  assert.equal(ssl.rejectUnauthorized, true);
  assert.equal(ssl.verifyIdentity, true);
  assert.equal(ssl.minVersion, 'TLSv1.2');
  assert.equal(ssl.ca.length, 1);
  assert.equal(new X509Certificate(ssl.ca[0]).fingerprint256, certificate.fingerprint256);
});

test('bundle aceita múltiplas CAs e valida também o último bloco', () => {
  const readFile = () => ca + '\n' + ca;
  assert.equal(readDatabaseTls(enabled, { ...options, readFile }).ca.length, 2);
  assert.throws(() => readDatabaseTls(enabled, {
    ...options, readFile: () => ca + '\n-----BEGIN CERTIFICATE-----\ninvalid\n-----END CERTIFICATE-----',
  }), /malformado/);
});
