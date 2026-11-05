import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

// Estes testes usam um sudo falso em uma pasta temporária: não alteram MySQL.
function fixture(t, overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), 'studyup-setup-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'backend/scripts'), { recursive: true });
  mkdirSync(join(root, 'backend/database'), { recursive: true });
  mkdirSync(join(root, 'bin'));
  copyFileSync(new URL('../scripts/setup-database.js', import.meta.url), join(root, 'backend/scripts/setup-database.js'));
  writeFileSync(join(root, 'package.json'), '{"type":"module"}');
  writeFileSync(join(root, 'backend/database/schema.sql'), 'SELECT 1;');
  writeFileSync(join(root, 'bin/sudo'), `#!/usr/bin/env node
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  if (process.env.FAKE_DB_FAIL === 'yes') process.exit(1);
  if (input.includes('SELECT COUNT(*)')) console.log(process.env.FAKE_DB_USERS || '0');
});
`, { mode: 0o700 });
  const run = () => spawnSync(process.execPath, [join(root, 'backend/scripts/setup-database.js')], {
    encoding: 'utf8', timeout: 5000,
    env: { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`, ...overrides },
  });
  return { root, run, envPath: join(root, 'env/.env') };
}

test('setup gera segredo protegido sem exibi-lo', t => {
  const { run, envPath } = fixture(t);
  const result = run();
  assert.equal(result.status, 0);
  const contents = readFileSync(envPath, 'utf8');
  const password = contents.match(/DB_PASSWORD="([^"]+)"/)[1];
  assert.ok(password.length >= 64);
  assert.equal(statSync(envPath).mode & 0o777, 0o600);
  assert.equal(statSync(dirname(envPath)).mode & 0o777, 0o700);
  assert.ok(!`${result.stdout}${result.stderr}`.includes(password));
});

test('setup preserva .env existente', t => {
  const { run, envPath } = fixture(t);
  mkdirSync(dirname(envPath), { recursive: true });
  writeFileSync(envPath, 'EXISTING=yes');
  assert.equal(run().status, 1);
  assert.equal(readFileSync(envPath, 'utf8'), 'EXISTING=yes');
});

test('setup não cria .env se já existe usuário da aplicação', t => {
  const { run, envPath } = fixture(t, { FAKE_DB_USERS: '1' });
  assert.equal(run().status, 1);
  assert.equal(existsSync(envPath), false);
});

test('setup preserva também configuração antiga na raiz', t => {
  const { root, run, envPath } = fixture(t);
  const legacy = join(root, '.env');
  writeFileSync(legacy, 'LEGACY=yes');
  assert.equal(run().status, 1);
  assert.equal(readFileSync(legacy, 'utf8'), 'LEGACY=yes');
  assert.equal(existsSync(envPath), false);
});

test('setup não cria .env se acesso administrativo falha', t => {
  const { run, envPath } = fixture(t, { FAKE_DB_FAIL: 'yes' });
  assert.equal(run().status, 1);
  assert.equal(existsSync(envPath), false);
});
