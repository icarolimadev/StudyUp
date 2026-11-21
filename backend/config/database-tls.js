import { readFileSync } from 'node:fs';
import { X509Certificate } from 'node:crypto';

// Mensagens controladas: não incluem PEM, senha nem erros internos do sistema.
export class DatabaseConfigError extends Error {}

export function readDatabaseTls(
  env,
  { readFile = readFileSync, now = Date.now } = {},
) {
  const flag = env.DB_TLS;
  if (flag !== undefined && !['true', 'false'].includes(flag)) {
    throw new DatabaseConfigError('DB_TLS deve ser true ou false.');
  }
  if (env.NODE_ENV === 'production' && flag !== 'true') {
    throw new DatabaseConfigError('Produção exige DB_TLS=true.');
  }
  if (flag !== 'true') {
    if (env.DB_CA_FILE !== undefined) {
      throw new DatabaseConfigError('DB_CA_FILE foi informado, mas TLS não está ativado.');
    }
    return undefined;
  }
  if (typeof env.DB_CA_FILE !== 'string' || !env.DB_CA_FILE.trim()) {
    throw new DatabaseConfigError('TLS exige DB_CA_FILE com o certificado CA.');
  }

  let pem;
  try {
    pem = readFile(env.DB_CA_FILE, 'utf8');
  } catch {
    throw new DatabaseConfigError('Não foi possível ler o arquivo indicado em DB_CA_FILE.');
  }
  const pattern = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
  const certificates = typeof pem === 'string' ? pem.match(pattern) : null;
  if (!certificates?.length || pem.replace(pattern, '').trim()) {
    throw new DatabaseConfigError('DB_CA_FILE deve conter somente certificados PEM válidos.');
  }

  const instant = now();
  // Examina todos os certificados: bundles permitem rotação da CA da Aiven.
  for (const certificate of certificates) {
    let ca;
    try {
      ca = new X509Certificate(certificate);
    } catch {
      throw new DatabaseConfigError('DB_CA_FILE contém um certificado malformado.');
    }
    if (!ca.ca) {
      throw new DatabaseConfigError('DB_CA_FILE contém um certificado que não é de CA.');
    }
    if (instant < ca.validFromDate.getTime() || instant > ca.validToDate.getTime()) {
      throw new DatabaseConfigError('DB_CA_FILE contém uma CA fora do período de validade.');
    }
  }

  // A conexão ainda precisa verificar a cadeia e o hostname do servidor real.
  return { ca: certificates, rejectUnauthorized: true, verifyIdentity: true, minVersion: 'TLSv1.2' };
}
