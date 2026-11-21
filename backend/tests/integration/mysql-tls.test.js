// Execução explícita: node --test backend/tests/integration/mysql-tls.test.js
// Requer mysqld e openssl. Não lê .env nem conecta ao MySQL da aplicação.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, copyFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setDefaultResultOrder } from 'node:dns';
import mysql from 'mysql2/promise';
import { createConnection as createRawConnection } from 'mysql2';
import { readDatabaseConfig } from '../../config/database.js';
import { launchServer, unusedPort, portIsClosed } from '../helpers/server-process.js';

const execute = promisify(execFile);
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
setDefaultResultOrder('ipv4first');

test('mysql2 verifica cadeia e hostname em MySQL isolado com TLS real', { timeout: 120_000 }, async t => {
  const directory = await mkdtemp(join(tmpdir(), 'studyup-mysql-tls-'));
  const datadir = join(directory, 'data');
  const socketPath = join(directory, 'mysql.sock');
  const mysqld = process.env.MYSQLD_BINARY || '/usr/sbin/mysqld';
  let processMysql;
  let admin;
  let exited;

  async function stop() {
    if (processMysql && processMysql.exitCode === null && processMysql.signalCode === null) {
      // SHUTDOWN pelo socket privado evita depender de permissão de sinais do SO.
      if (!admin) admin = await mysql.createConnection({ socketPath, user: 'root', connectTimeout: 1000 });
      await admin.query('SHUTDOWN');
      await exited;
    }
    if (admin) { await admin.end().catch(() => {}); admin = undefined; }
  }
  t.after(async () => { await stop(); await rm(directory, { recursive: true, force: true }); });

  async function openssl(args) {
    await execute('openssl', args, { cwd: directory, timeout: 15_000 });
  }
  for (const ca of ['trusted', 'other']) {
    await openssl(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2',
      '-keyout', `${ca}.key`, '-out', `${ca}.pem`, '-subj', `/CN=StudyUp temporary ${ca} CA`,
      '-addext', 'basicConstraints=critical,CA:TRUE']);
  }
  await writeFile(join(directory, 'index.txt'), '');
  await writeFile(join(directory, 'serial'), '1000\n');
  await writeFile(join(directory, 'ca.conf'), `[ca]
default_ca=issuer
[issuer]
database=index.txt
serial=serial
new_certs_dir=.
certificate=trusted.pem
private_key=trusted.key
default_md=sha256
policy=subject
[subject]
commonName=supplied
`);
  for (const [name, dns, days] of [['valid', 'localhost', '2'], ['mismatch', 'wrong.example.invalid', '2'], ['expired', 'localhost', '-1']]) {
    await openssl(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', `${name}.key`,
      '-out', `${name}.csr`, '-subj', `/CN=${dns}`]);
    await writeFile(join(directory, `${name}.ext`), `basicConstraints=critical,CA:FALSE\nsubjectAltName=DNS:${dns}\nextendedKeyUsage=serverAuth\n`);
    if (name === 'expired') {
      await openssl(['ca', '-batch', '-config', 'ca.conf', '-in', `${name}.csr`,
        '-startdate', '200101000000Z', '-enddate', '200102000000Z',
        '-out', `${name}.pem`, '-notext', '-extfile', `${name}.ext`]);
    } else {
      await openssl(['x509', '-req', '-in', `${name}.csr`, '-CA', 'trusted.pem', '-CAkey', 'trusted.key',
        '-CAcreateserial', '-days', days, '-out', `${name}.pem`, '-extfile', `${name}.ext`]);
    }
  }
  await mkdir(datadir);
  await execute(mysqld, ['--no-defaults', '--initialize-insecure', `--datadir=${datadir}`], { timeout: 60_000 });
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));

  async function setCertificate(name) {
    await copyFile(join(directory, `${name}.pem`), join(directory, 'server.pem'));
    await copyFile(join(directory, `${name}.key`), join(directory, 'server.key'));
    if (admin) await admin.query('ALTER INSTANCE RELOAD TLS');
  }
  await setCertificate('valid');

  async function start(tlsEnabled) {
    const args = ['--no-defaults', `--datadir=${datadir}`, `--socket=${socketPath}`,
      `--pid-file=${join(directory, 'mysql.pid')}`, `--log-error=${join(directory, 'mysql.log')}`,
      '--bind-address=127.0.0.1', `--port=${port}`, '--mysqlx=OFF', '--skip-log-bin',
      '--innodb-buffer-pool-size=64M', '--max-connections=10',
      ...(tlsEnabled ? [`--ssl-ca=${join(directory, 'trusted.pem')}`,
        `--ssl-cert=${join(directory, 'server.pem')}`, `--ssl-key=${join(directory, 'server.key')}`,
        '--require-secure-transport=ON'] : ['--tls-version=', '--require-secure-transport=OFF'])];
    processMysql = spawn(mysqld, args, { stdio: 'ignore' });
    exited = new Promise((resolve, reject) => { processMysql.once('exit', resolve); processMysql.once('error', reject); });
    exited.catch(() => {});
    for (let attempt = 0; attempt < 100; attempt++) {
      if (processMysql.exitCode !== null) throw new Error('MySQL temporário encerrou antes de ficar pronto.');
      try { admin = await mysql.createConnection({ socketPath, user: 'root', connectTimeout: 500 }); return; }
      catch { await pause(150); }
    }
    throw new Error('MySQL temporário não iniciou no prazo.');
  }
  await start(true);
  await admin.query('CREATE DATABASE tls_test');
  const startupPassword = 'private-startup-password-fixture';
  await admin.query("CREATE USER 'startup_user'@'localhost' IDENTIFIED BY ?", [startupPassword]);
  await admin.query("GRANT SELECT ON tls_test.* TO 'startup_user'@'localhost'");

  const env = {
    NODE_ENV: 'production', DB_HOST: 'localhost', DB_PORT: String(port),
    DB_NAME: 'tls_test', DB_USER: 'root', DB_PASSWORD: 'unused-config-placeholder',
    DB_TLS: 'true', DB_CA_FILE: join(directory, 'trusted.pem'),
  };
  // Somente a instância temporária tem root local sem senha. A configuração
  // exige senha; o teste substitui apenas a credencial, nunca as opções TLS.
  function options(overrides = {}) {
    return { ...readDatabaseConfig({ ...env, ...overrides }), password: '' };
  }
  async function expectRejected(config, pattern) {
    const raw = createRawConnection(config);
    try {
      await assert.rejects(raw.promise().connect(),
        error => pattern.test(`${error.code} ${error.message}`));
    } finally { raw.destroy(); }
  }

  async function expectStartupFailure(context, overrides, message) {
    const httpPort = await unusedPort();
    const server = launchServer(context, {
      ...env, DB_USER: 'startup_user', DB_PASSWORD: startupPassword,
      ...overrides, PORT: String(httpPort),
    });
    assert.deepEqual(await server.exited, { code: 1, signal: null });
    assert.doesNotMatch(server.stdout, /disponível|Status da API/);
    assert.match(server.stderr, message);
    assert.equal(await portIsClosed(httpPort), true);
    for (const value of [startupPassword, 'startup_user', 'BEGIN CERTIFICATE', directory]) {
      assert.ok(!(server.stdout + server.stderr).includes(value), 'Logs não devem expor detalhes privados');
    }
  }

  await t.test('server.js em produção executa SELECT 1 e só então anuncia HTTP disponível', async context => {
    await admin.query("SET GLOBAL log_output = 'TABLE'");
    await admin.query('SET GLOBAL general_log = ON');
    try {
      const httpPort = await unusedPort();
      const server = launchServer(context, {
        ...env, DB_USER: 'startup_user', DB_PASSWORD: startupPassword, PORT: String(httpPort),
      });
      await server.ready();
      // Verifica no próprio MySQL que a consulta ocorreu antes de qualquer GET.
      const [queries] = await admin.query(`SELECT COUNT(*) AS total FROM mysql.general_log
        WHERE command_type = 'Execute' AND argument = 'SELECT 1' AND user_host LIKE 'startup_user[%';`);
      assert.ok(queries[0].total > 0);
      const response = await fetch(`http://127.0.0.1:${httpPort}/api/status`);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).database, 'connected');
      // Sessões ainda usam MemoryStore: o aviso em produção é esperado nesta etapa.
      assert.doesNotMatch(server.stderr, /Falha na configuração MySQL|Falha na validação TLS|Não foi possível conectar/);
      assert.ok(!(server.stdout + server.stderr).includes(startupPassword));
    } finally { await admin.query('SET GLOBAL general_log = OFF'); }
  });

  await t.test('server.js recusa CA errada sem abrir HTTP ou expor certificado', async context => {
    await expectStartupFailure(context, { DB_CA_FILE: join(directory, 'other.pem') }, /validação TLS/);
  });

  await t.test('server.js recusa credencial errada sem expor usuário ou senha', async context => {
    await expectStartupFailure(context, { DB_PASSWORD: startupPassword + '-wrong' }, /Confira rede e credenciais/);
  });

  await t.test('porta HTTP ocupada após validar banco fecha pool e encerra o processo', async context => {
    const occupied = createServer();
    occupied.listen(0, '127.0.0.1'); await once(occupied, 'listening');
    context.after(() => new Promise(resolve => occupied.close(resolve)));
    const server = launchServer(context, {
      ...env, DB_USER: 'startup_user', DB_PASSWORD: startupPassword, PORT: String(occupied.address().port),
    });
    assert.deepEqual(await server.exited, { code: 1, signal: null });
    assert.match(server.stderr, /está ocupada/);
    assert.doesNotMatch(server.stdout, /disponível/);
  });

  await t.test('CA correta e hostname correto conectam com cifra TLS ativa', async () => {
    const connection = await mysql.createConnection(options());
    try {
      const [rows] = await connection.query("SHOW SESSION STATUS LIKE 'Ssl_cipher'");
      assert.ok(rows[0].Value.length > 0);
      const [result] = await connection.execute('SELECT 1 AS ok');
      assert.equal(result[0].ok, 1);
    } finally { await connection.end(); }
  });
  await t.test('CA válida mas não emissora é rejeitada', async () => {
    await expectRejected(options({ DB_CA_FILE: join(directory, 'other.pem') }), /self.signed|unable to verify|issuer|certificate chain/i);
  });
  await t.test('certificado assinado pela CA correta com hostname errado é rejeitado', async () => {
    await setCertificate('mismatch');
    await expectRejected(options(), /Hostname\/IP does not match|not in the cert|ALTNAME/i);
  });
  await t.test('server.js recusa hostname divergente sem abrir HTTP', async context => {
    await expectStartupFailure(context, {}, /validação TLS/);
  });
  await t.test('MySQL recusa ativar certificado de servidor vencido', async () => {
    await assert.rejects(setCertificate('expired'), { code: 'ER_DA_SSL_LIBRARY_ERROR' });
    await setCertificate('valid');
  });
  await t.test('servidor sem TLS é rejeitado sem fallback para conexão simples', async () => {
    await stop();
    await start(false);
    await expectRejected(options(), /does not support secure connection|SSL|TLS/i);
  });
  await t.test('mesma instância sem TLS continua acessível pela configuração local', async () => {
    const local = readDatabaseConfig({ DB_HOST: '127.0.0.1', DB_PORT: String(port),
      DB_NAME: 'tls_test', DB_USER: 'root', DB_PASSWORD: 'unused-config-placeholder' });
    const connection = await mysql.createConnection({ ...local, password: '' });
    try {
      const [rows] = await connection.query("SHOW SESSION STATUS LIKE 'Ssl_cipher'");
      assert.equal(rows[0].Value, '');
      await connection.execute('SELECT 1');
    } finally { await connection.end(); }
  });
});
