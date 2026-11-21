# Preparar o esquema MySQL remoto — migração 001

Artefatos locais preparados em 06/11/2026. Nenhum comando remoto deste roteiro foi executado. A migração deve ser revisada e executada manualmente; não integra `npm start`, build ou deploy.

## Arquivos e responsabilidades

- `001-initial.sql`: cria `usuarios`, `disciplinas` e `tarefas`, nessa ordem, num banco previamente selecionado e vazio. Mantém colunas, defaults, índices, FKs, CHECKs e InnoDB do `../schema.sql`. Explicita utf8mb4/utf8mb4_0900_ai_ci em cada tabela, antes herdados do banco. Não contém CREATE DATABASE, USE, INSERT, DROP ou IF NOT EXISTS.
- `001-expected-schema.json`: referência de SHOW CREATE TABLE obtida aplicando o esquema original num MySQL 8.4.11 descartável. Contém estrutura, não dados nem credenciais. Não atualizar automaticamente para fazer uma divergência desaparecer.
- `../validate-schema.js`: somente SELECT/SHOW; confere charset/collation do banco e as três definições completas. Ignora somente CRLF/espaços externos e o contador de próximo AUTO_INCREMENT da tabela. Preserva a declaração AUTO_INCREMENT da coluna.
- `../../scripts/validate-database-schema.js`: comando de leitura que exige DB_HOST, DB_PORT e DB_NAME explícitos, usa configuração/TLS existentes e retorna código 0 no sucesso ou 1 na falha. Não carrega env/.env automaticamente, cria tabelas ou corrige diferenças.

A comparação é deliberadamente estrita. Mudanças na representação de SHOW CREATE TABLE entre versões do MySQL podem exigir revisão manual; uma divergência não autoriza ALTER ou regeneração da referência. O nome do banco não precisa ser studyup, mas os padrões devem ser utf8mb4/utf8mb4_0900_ai_ci.

## 1. Preparar o destino sem mudar o ambiente local

Não executar `npm run db:setup` para Aiven: o instalador usa sudo/mysql local e grava env/.env. Não alterar esse arquivo para preparar o remoto. Não exportar credenciais remotas permanentemente no shell do desenvolvimento.

No painel da Aiven, confirmar serviço, região, versão MySQL, hostname e porta; obter a CA oficial. Guardar o certificado separadamente, por exemplo em env/aiven-ca.pem, e usar a conta administrativa somente no provisionamento. A conta do Render será outra, restrita. Confirmar o plano selecionado e as permissões disponíveis no serviço.

Antes de qualquer escrita, conectar explicitamente por TCP com validação de cadeia e hostname. Exemplo com placeholders a substituir, sem senha na linha de comando:

```sh
MYSQL_HISTFILE=/dev/null mysql \
  --no-defaults --no-login-paths --protocol=TCP \
  --host=HOSTNAME_EXATO_DA_AIVEN --port=PORTA_DA_AIVEN \
  --user=USUARIO_ADMINISTRATIVO --password \
  --ssl-mode=VERIFY_IDENTITY --ssl-ca="$PWD/env/aiven-ca.pem"
```

Conferir o destino por consultas de leitura:

```sql
SELECT VERSION(), @@server_uuid, CURRENT_USER(), DATABASE();
SHOW SESSION STATUS LIKE 'Ssl_cipher';
SELECT @@sql_mode, @@session.time_zone;
SHOW COLLATION LIKE 'utf8mb4_0900_ai_ci';
SHOW GRANTS FOR CURRENT_USER();
```

TLS deve estar ativo e a versão deve suportar os CHECKs e a collation. Comparar hostname/porta com o painel; não confiar somente no nome studyup, que também existe localmente. Parar se houver dúvida sobre o destino, certificado ou permissões.

## 2. Criar um banco dedicado e conferir que está vazio

Com autorização para o destino confirmado, criar o banco no painel ou por SQL administrativo. Exemplo para um banco novo:

```sql
CREATE DATABASE studyup
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

Não usar DROP nem sobrescrever um banco existente. Se studyup já existir, inspecionar antes de continuar. Reconectar selecionando explicitamente `--database=studyup` e conferir:

```sql
SELECT DATABASE();
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = DATABASE();
SELECT TABLE_NAME, TABLE_TYPE
FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE();
```

A última consulta deve retornar zero linhas, com uma conta que tenha visibilidade administrativa do banco. Não aplicar 001 sobre banco com tabelas/dados existentes. Fazer backup e preparar uma migração específica se esse for o caso.

## 3. Aplicar uma única vez e registrar a versão

Executar os testes descartáveis antes. Registrar commit/revisão dos arquivos, destino, data e checksum, sem credenciais:

```sh
sha256sum backend/database/schema.sql backend/database/migrations/001-initial.sql
```

Exemplo de aplicação futura, somente após as conferências anteriores:

```sh
MYSQL_HISTFILE=/dev/null mysql \
  --no-defaults --no-login-paths --protocol=TCP \
  --host=HOSTNAME_EXATO_DA_AIVEN --port=PORTA_DA_AIVEN \
  --user=USUARIO_ADMINISTRATIVO --password \
  --ssl-mode=VERIFY_IDENTITY --ssl-ca="$PWD/env/aiven-ca.pem" \
  --database=studyup \
  < backend/database/migrations/001-initial.sql
```

Conferir o código de saída. Não usar `--force`. Erro interrompe o lote, mas DDL pode ter confirmado tabelas anteriores: não existe rollback único das três criações. Em falha parcial, interromper e inspecionar; não apagar nem reaplicar automaticamente. Repetir 001 sobre esquema já criado falha em vez de ignorar diferenças. O registro da execução deve distinguir iniciada, falhou parcialmente e concluída após validação.

## 4. Criar conta restrita e conferir grants efetivos

Models atuais precisam de:

| Tabela | Permissões |
| --- | --- |
| usuarios | SELECT, INSERT |
| disciplinas | SELECT, INSERT, UPDATE, DELETE |
| tarefas | SELECT, INSERT, UPDATE, DELETE |

A Aiven pode conceder privilégios administrativos por padrão ao criar usuários de serviço. Quando suportado, criar com `mysql_grants: []` e conceder os privilégios por tabela. Conferir SHOW GRANTS e privilégios herdados; conceder privilégios menores não remove grants globais anteriores. Não restringir a conta administrativa do provedor nem usar essa conta no backend.

Após confirmar o identificador real da conta, exemplo caso seja `'studyup_app'@'%'`:

```sql
GRANT SELECT, INSERT ON studyup.usuarios TO 'studyup_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON studyup.disciplinas TO 'studyup_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON studyup.tarefas TO 'studyup_app'@'%';
SHOW GRANTS FOR 'studyup_app'@'%';
```

O host da conta deve corresponder ao criado no serviço; não copiar 127.0.0.1 do instalador local. A aplicação não precisa de CREATE, ALTER, DROP, CREATE USER, GRANT OPTION ou LOCK TABLES. Permissões para provisionamento, backup e futuras migrações pertencem a contas/execuções administrativas separadas.

## 5. Executar o validador somente de leitura

Criar futuramente `env/aiven-validation.env` separado do env/.env local, com permissão 0600, contendo:

```dotenv
NODE_ENV=production
DB_HOST=HOSTNAME_EXATO_DA_AIVEN
DB_PORT=PORTA_DA_AIVEN
DB_NAME=studyup
DB_USER=USUARIO_RESTRITO
DB_PASSWORD="PREENCHER_SOMENTE_NO_ARQUIVO_PRIVADO"
DB_TLS=true
DB_CA_FILE=/CAMINHO/ABSOLUTO/PARA/env/aiven-ca.pem
```

Na raiz do repositório, um ambiente limpo evita que variáveis exportadas anteriormente substituam os valores desse arquivo:

```sh
env -i PATH="$PATH" node --env-file=env/aiven-validation.env \
  backend/scripts/validate-database-schema.js
```

A senha não vai para argumentos nem logs. O certificado é validado pelo módulo TLS existente. O teste do comando foi feito com usuário somente SELECT: nenhuma permissão de escrita é necessária para a inspeção. O comando exige acesso às três tabelas; tabela invisível por falta de permissão também causa falha.

O resultado cobre estrutura, não grants, dados, triggers, rotinas ou disponibilidade contínua. Não substitui backup/restauração e testes funcionais. `npm run db:check` continua sendo o comando local e verifica apenas conexão/presença das tabelas; não foi alterado para apontar à Aiven.

## 6. Horários, sessões e evolução

- Prazo/conclusão continuam DATETIME, com horário civil de Fortaleza. Não converter dados para UTC na migração. O teste confirma que trocar a sessão MySQL entre +00:00 e -03:00 não altera esses valores.
- Campos de auditoria continuam TIMESTAMP, incluindo defaults e ON UPDATE originais. Sua apresentação depende do fuso da sessão MySQL; não confundir com os prazos civis.
- Tabelas adicionais são avisadas, não removidas nem consideradas validadas. Isso permite que uma futura tabela de sessões exista sem invalidar o núcleo 001.
- Sessões exigirão outra migração, sua própria validação e grants. Não criar uma tabela antecipadamente sem escolher o armazenamento de sessões.
- Depois da primeira aplicação, 001 é imutável. Uma mudança no núcleo exige migração numerada nova e evolução explícita do contrato de validação. Não editar o JSON para encobrir alterações acidentais.

## 7. Testes e aceite

```sh
npm test
node --test backend/tests/integration/mysql-schema.test.js
```

O segundo comando requer MySQL Server 8.4 e Node.js 24. Inicializa uma instância descartável com datadir/socket próprios, porta livre em loopback e sem carregar .env. Aplica o original e a migração em bancos diferentes; compara SHOW CREATE TABLE, testa constraints/horários, provoca divergências em bancos descartáveis e verifica o CLI com usuário somente SELECT. Desliga via socket privado e remove o diretório temporário. Nunca usa o serviço MySQL do StudyUp ou Aiven.

O aceite remoto futuro exige: estrutura válida, grants mínimos, CRUD/isolamento com dados fictícios e backup restaurável em destino separado. Os testes remotos não foram executados nesta entrega.

Fontes do procedimento: [usuários Aiven](https://aiven.io/docs/products/mysql/howto/manage-service-users), [criação de bancos](https://aiven.io/docs/products/mysql/howto/create-database), [TLS e CA](https://aiven.io/docs/platform/concepts/tls-ssl-certificates).
