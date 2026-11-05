# Preparar MySQL local — bloco 7.2

O backend usa `mysql2` para conversar com MySQL. O servidor MySQL é um processo separado do Node.js.

## 1. Instalação no Ubuntu deste computador

Execute no seu terminal; a senha de sudo deve ser digitada apenas nele:

```sh
sudo apt-get install mysql-server
sudo systemctl enable --now mysql
mysql --version
```

O pacote disponível neste ambiente é MySQL 8.4. Instalar depende de autenticação administrativa; os comandos não foram concluídos pelo agente.

## 2. Criar o esquema

### Configuração assistida (alternativa aos passos manuais 2–4)

Para uma configuração inicial sem `env/.env` e sem usuário `studyup_app` existente, execute na raiz, como seu usuário normal:

```sh
sudo -v
npm run db:setup
npm run db:check
```

O primeiro comando autentica você no terminal. O script usa o acesso administrativo apenas no cliente MySQL, aplica o esquema, cria o usuário com SELECT/INSERT/UPDATE/DELETE e gera `env/.env` com senha aleatória e permissão 0600. A senha não aparece no terminal nem nos argumentos dos processos. Não execute npm com sudo.

O script recusa sobrescrever `env/.env` ou reutilizar usuário existente. Se falhar depois de iniciar, preserva `env/.env` para recuperação: a criação do esquema e da conta não é uma transação única, e pode haver configuração parcial. Não apague nem repita automaticamente; revise o estado antes. Os passos manuais abaixo são uma alternativa, não devem ser executados novamente após sucesso do script.

Na raiz do projeto:

```sh
sudo mysql < backend/database/schema.sql
```

O script cria `studyup` e três tabelas sem apagar registros. `IF NOT EXISTS` não atualiza uma tabela antiga: alterações futuras precisarão de migrações explícitas.

- `usuarios`: identidade, e-mail único e hash da senha; ainda não há cadastro real.
- `disciplinas`: nome, cor e usuário proprietário.
- `tarefas`: usuário proprietário, disciplina opcional, título, descrição, prazo, prioridade e conclusão.

A chave estrangeira composta `(usuario_id, disciplina_id)` impede uma tarefa de apontar para a disciplina de outro usuário. Exclusão de disciplina com tarefas é bloqueada. Isso complementa a autorização que ainda será implementada na API; não impede, sozinho, uma consulta SELECT de ler registros de outro usuário.

`data_limite` e `concluida_em` usam DATETIME com horário civil de Fortaleza. Os campos de auditoria usam TIMESTAMP; sua apresentação dependerá do fuso da sessão MySQL. `dateStrings` evita conversões implícitas pelo driver. O tratamento dos horários será integrado às APIs antes de substituir os exemplos do frontend.

## 3. Criar um usuário exclusivo para a aplicação

Abra uma sessão administrativa sem gravar histórico do cliente:

```sh
sudo env MYSQL_HISTFILE=/dev/null mysql
```

Digite o SQL abaixo substituindo o exemplo por uma senha exclusiva. Não envie a senha pelo chat nem a salve no repositório:

```sql
CREATE USER 'studyup_app'@'127.0.0.1' IDENTIFIED BY 'SUBSTITUA_POR_UMA_SENHA_EXCLUSIVA';
GRANT SELECT, INSERT, UPDATE, DELETE ON studyup.* TO 'studyup_app'@'127.0.0.1';
EXIT;
```

Se esse usuário já existir, não o exclua para repetir o procedimento. Confira sua configuração antes de continuar. O usuário da aplicação não precisa de permissões para criar/apagar bancos ou tabelas.

## 4. Configurar o Node.js

Crie a pasta privada com `mkdir -p env && chmod 700 env`. Se `env/.env` ainda não existir, copie `.env.example` para `env/.env`. Se já existir, edite-o preservando sua configuração. Descomente as linhas DB_* e preencha a mesma senha usada no MySQL. Para valores com `#` ou espaços, coloque o valor entre aspas. Restrinja o arquivo com `chmod 600 env/.env`. A pasta `env/` já é ignorada pelo Git; nunca coloque essas informações no frontend.

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=studyup
DB_USER=studyup_app
DB_PASSWORD="sua senha local"
```

## 5. Verificar

```sh
npm run db:check
npm start
```

`db:check` executa SELECT 1 e verifica a existência das três tabelas, sem alterar registros. Ele não comprova sozinho todas as constraints nem as permissões de escrita.

Abra http://127.0.0.1:3000/api/status. Os resultados possíveis são:

| database | HTTP | Significado |
| --- | --- | --- |
| `not_configured` | 200 | Nenhuma credencial foi configurada; a prévia continua disponível. |
| `connected` | 200 | SELECT 1 executado no banco selecionado. Não confirma o esquema. |
| `unavailable` | 503 | Configuração incompleta/inválida, serviço indisponível ou acesso negado. |

O módulo `backend/config/database.js` mantém um pool: um conjunto pequeno de conexões reutilizadas, em vez de abrir uma conexão nova a cada pedido. O pool é encerrado ao finalizar o servidor.

Mesmo após conectar, o frontend continua em demonstração. A integração dos cadastros depende dos blocos de autenticação e APIs.
