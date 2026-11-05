import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
// Parâmetros scrypt: 32 MiB de memória e três passagens de trabalho.
// Guardamos algoritmo e parâmetros junto do salt e do resultado para o login.
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64, {
    N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$32768$8$3$${salt}$${key.toString('hex')}`;
}

// Custo equivalente para e-mail desconhecido, sem manter uma conta fictícia.
const dummyHash = `scrypt$32768$8$3$${'0'.repeat(32)}$${'0'.repeat(128)}`;

export async function verifyPassword(password, storedHash) {
  const validFormat = typeof storedHash === 'string'
    && /^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(storedHash);
  const [, , , , salt, expectedHex] = (validFormat ? storedHash : dummyHash).split('$');
  const actual = await deriveKey(password, salt, 64, {
    N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024,
  });
  const matches = timingSafeEqual(actual, Buffer.from(expectedHex, 'hex'));
  return validFormat && matches;
}
