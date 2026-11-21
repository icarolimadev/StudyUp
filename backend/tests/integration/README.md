# Teste real de TLS com MySQL isolado

Na raiz do projeto, execute:

```sh
node --test backend/tests/integration/mysql-tls.test.js
```

Pré-requisitos: Node.js 24, dependências instaladas, MySQL Server 8.4 (`/usr/sbin/mysqld`) e OpenSSL. Se necessário, informar o executável com `MYSQLD_BINARY`. Executar como usuário normal, com permissão para iniciar um processo e abrir porta em loopback. Não usa sudo nem configura o serviço MySQL do computador.

O teste não carrega `.env` e não consulta o banco StudyUp. Inicializa outro MySQL em diretório temporário privado, usa socket próprio e porta TCP livre em 127.0.0.1. Certificados, chaves e dados fictícios são gerados para cada execução e removidos ao terminar. Root sem senha existe somente nessa instância temporária de teste.

Onze cenários:

1. CA confiável e hostname correto: conexão e consulta funcionam; `Ssl_cipher` não está vazio.
2. CA válida, porém diferente da emissora: mysql2 rejeita a cadeia.
3. Certificado emitido pela CA confiável com SAN diferente de localhost: mysql2 rejeita o hostname.
4. Certificado de servidor vencido: MySQL 8.4 rejeita sua ativação via `ALTER INSTANCE RELOAD TLS`. Este caso confirma a defesa do servidor, não um handshake do cliente com certificado vencido. Validade da CA no cliente também tem testes unitários com relógio controlado.
5. MySQL reiniciado sem TLS: configuração TLS do cliente é rejeitada, sem fallback.
6. Esse mesmo servidor sem TLS aceita a configuração local e retorna `Ssl_cipher` vazio.
7. `server.js` em produção executa `SELECT 1` antes de anunciar disponibilidade. A consulta é confirmada no log do MySQL temporário antes de qualquer GET HTTP; depois a API responde com banco conectado.
8. Inicialização com CA errada encerra com código 1, sem sucesso anunciado, porta aberta ou certificado exposto.
9. Inicialização com senha errada encerra sem expor credenciais.
10. Inicialização com hostname divergente encerra sem abrir HTTP.
11. Porta HTTP ocupada depois da verificação do banco fecha o pool e encerra o processo.

O runner conta doze testes (um agrupador mais onze subtestes). A suíte padrão `npm test` permanece independente de mysqld/OpenSSL: os testes reais são executados separadamente. Os oito cenários de `server-startup.test.js` também executam o processo real de server.js, usando configuração inválida ou servidores TCP controlados quando necessário.

O teste de sucesso aceita o aviso de MemoryStore do express-session em produção: sessões persistentes ainda são uma etapa separada, e esse aviso não é suprimido. O log geral do MySQL é ativado somente na instância descartável para confirmar a consulta inicial; não é ativado no banco StudyUp.

O desligamento é feito com `SHUTDOWN` pelo socket exclusivo da instância de teste. Não se usa `systemctl`, não se encerra o serviço MySQL existente e não se desativa a validação de certificados no cliente. Para desativar TLS somente na instância temporária, usa-se `--tls-version=`, conforme a [documentação do MySQL 8.4](https://dev.mysql.com/doc/refman/8.4/en/encrypted-connection-protocols-ciphers.html).

Teste executado em 05/11/2026 com mysql2 3.24.6 e MySQL 8.4.11. Isso valida o driver instalado e nossa configuração em TLS real; não substitui o futuro teste com o hostname, a CA e as credenciais do serviço Aiven.
