import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer, createConnection } from 'node:net';
import { fileURLToPath } from 'node:url';

export const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function unusedPort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

export function launchServer(t, overrides) {
  // Não carregar .env nem herdar configuração do banco de quem executa o teste.
  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !key.startsWith('DB_') && !['NODE_ENV', 'NODE_OPTIONS', 'HOST', 'PORT'].includes(key)));
  const child = spawn(process.execPath, ['--dns-result-order=ipv4first',
    fileURLToPath(new URL('../../server.js', import.meta.url))], {
    env: { ...env, HOST: '127.0.0.1', NODE_ENV: 'development', ...overrides },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', data => { stdout += data; });
  child.stderr.on('data', data => { stderr += data; });
  const exited = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  exited.catch(() => {});
  const watchdog = setTimeout(() => child.kill('SIGKILL'), 15_000);
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    try { await exited; } finally { clearTimeout(watchdog); }
  });
  return {
    child, exited,
    get stdout() { return stdout; },
    get stderr() { return stderr; },
    async ready() {
      for (let attempt = 0; attempt < 100; attempt++) {
        if (stdout.includes('StudyUp disponível')) return;
        if (child.exitCode !== null || child.signalCode !== null) break;
        await pause(50);
      }
      throw new Error('Servidor de teste não anunciou inicialização.');
    },
  };
}

export async function portIsClosed(port) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(1500);
    socket.on('connect', () => { socket.destroy(); resolve(false); });
    socket.on('error', error => error.code === 'ECONNREFUSED' ? resolve(true) : reject(error));
    socket.on('timeout', () => { socket.destroy(); reject(new Error('Probe TCP excedeu o prazo.')); });
  });
}
