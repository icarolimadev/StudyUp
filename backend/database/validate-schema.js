import { readFileSync } from 'node:fs';

export const coreTables = ['usuarios', 'disciplinas', 'tarefas'];

export function normalizeCreateTable(ddl) {
  // O próximo ID muda com dados legítimos, mas não faz parte da estrutura.
  // Só remove a opção da tabela, preservando AUTO_INCREMENT nas colunas.
  return ddl.replace(/\r\n/g, '\n').trim()
    .replace(/(\) ENGINE=\w+) AUTO_INCREMENT=\d+/, '$1');
}

export async function inspectSchema(connection) {
  // Metadados sem cache de prepared statements: USE pode mudar o contexto.
  // Valores continuam separados do SQL, com parâmetros escapados pelo driver.
  const [[current]] = await connection.query('SELECT DATABASE() AS name');
  if (!current.name) throw new Error('Selecione explicitamente o banco que será validado.');
  const [[schema]] = await connection.query(`SELECT DEFAULT_CHARACTER_SET_NAME AS charset,
    DEFAULT_COLLATION_NAME AS collation FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`, [current.name]);
  if (!schema) throw new Error('Não foi possível consultar os metadados do banco selecionado.');
  const [tables] = await connection.query(`SELECT TABLE_NAME AS name, TABLE_TYPE AS type
    FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`, [current.name]);
  const definitions = {};
  for (const table of coreTables) {
    if (tables.some(row => row.name === table && row.type === 'BASE TABLE')) {
      // Identificador vem exclusivamente da lista fixa acima, nunca do usuário.
      const [[row]] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
      definitions[table] = normalizeCreateTable(row['Create Table']);
    }
  }
  return { schema, definitions, extraTables: tables.map(t => t.name).filter(name => !coreTables.includes(name)) };
}

export function compareSchema(actual, expected) {
  const errors = [];
  if (actual.schema.charset !== expected.schema.charset) errors.push('Charset padrão do banco divergente.');
  if (actual.schema.collation !== expected.schema.collation) errors.push('Collation padrão do banco divergente.');
  for (const table of coreTables) {
    if (!actual.definitions[table]) errors.push(`Tabela ${table} ausente, invisível ao usuário ou não é tabela base.`);
    else if (actual.definitions[table] !== expected.definitions[table]) errors.push(`Estrutura de ${table} divergente da referência 001.`);
  }
  return { valid: errors.length === 0, errors, extraTables: actual.extraTables };
}

export async function validateSchema(connection) {
  const expected = JSON.parse(readFileSync(new URL('./migrations/001-expected-schema.json', import.meta.url), 'utf8'));
  return compareSchema(await inspectSchema(connection), expected);
}
