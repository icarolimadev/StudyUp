import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Execute como usuário normal após sudo -v. Só o cliente MySQL usa sudo.
// A senha gerada vai por stdin ao MySQL, nunca por argumentos ou logs.
const envDirectory = fileURLToPath(new URL('../../env/', import.meta.url));
const envPath = fileURLToPath(new URL('../../env/.env', import.meta.url));
const legacyEnvPath = fileURLToPath(new URL('../../.env', import.meta.url));
const schemaPath = fileURLToPath(new URL('../database/schema.sql', import.meta.url));

function adminQuery(sql) {
  const result = spawnSync('sudo', ['-n', 'mysql', '--batch', '--skip-column-names'], {
    input: sql,
    encoding: 'utf8',
    timeout: 30000,
    env: { ...process.env, MYSQL_HISTFILE: '/dev/null' },
  });
  if (result.error || result.status !== 0) {
    // stderr pode conter SQL ou dados sensíveis. Não o reproduzimos.
    throw new Error('Operação administrativa falhou. Confira sudo -v e o serviço MySQL. Nenhuma senha será exibida.');
  }
  return result.stdout.trim();
}

try {
  if (existsSync(envPath) || existsSync(legacyEnvPath)) {
    throw new Error('O arquivo .env já existe. Configuração interrompida para preservá-lo; não o apague sem revisar o estado do banco.');
  }
  const users = adminQuery("SELECT COUNT(*) FROM mysql.user WHERE User = 'studyup_app';");
  if (users !== '0') {
    throw new Error('O usuário studyup_app já existe. Configuração interrompida para preservar seu acesso.');
  }

  const password = `Su9!${randomBytes(32).toString('hex')}`;
  const env = [
    'HOST=127.0.0.1', 'PORT=3000', 'DB_HOST=127.0.0.1', 'DB_PORT=3306',
    'DB_NAME=studyup', 'DB_USER=studyup_app', `DB_PASSWORD="${password}"`, '',
  ].join('\n');
  // Reserva o arquivo sem sobrescrever nada. 0600: leitura/escrita só pelo dono.
  mkdirSync(envDirectory, { recursive: true, mode: 0o700 });
  chmodSync(envDirectory, 0o700);
  writeFileSync(envPath, env, { flag: 'wx', mode: 0o600 });

  adminQuery(readFileSync(schemaPath, 'utf8'));
  adminQuery(`
    CREATE USER 'studyup_app'@'127.0.0.1' IDENTIFIED BY '${password}';
    GRANT SELECT, INSERT, UPDATE, DELETE ON studyup.* TO 'studyup_app'@'127.0.0.1';
  `);
  console.log('Esquema aplicado e usuário studyup_app criado com permissões de dados.');
  console.log('env/.env criado com acesso restrito. Senha gerada localmente, não exibida.');
  console.log('Próximo passo: npm run db:check');
} catch (error) {
  console.error(error.message);
  if (existsSync(envPath)) {
    console.error('O .env foi preservado. Em caso de falha parcial, revise o banco antes de repetir a configuração.');
  }
  process.exitCode = 1;
}
