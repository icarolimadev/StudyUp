# Revisão de segurança — 05/11/2026

Escopo: código atual, dependências npm, configuração local, API e fluxo no Chrome. Esta revisão não é um pentest exaustivo nem certificação para publicar o sistema na internet.

## Resultado

Não foi encontrado um caminho explorável de injeção SQL ou acesso aos registros de outra conta nos caminhos revisados e testados. Foi encontrada e corrigida uma lacuna de abuso de cadastro: havia limite de concorrência, mas faltava limite de tentativas ao longo do tempo.

| Item | Evidência / resultado |
| --- | --- |
| Credenciais | `.env` movido para `env/.env`, preservando seu conteúdo. Pasta 0700, arquivo 0600, pasta inteira ignorada pelo Git. Comandos start/dev/db:check e configuração inicial atualizados. |
| Outros segredos | Não identificados outros arquivos de credenciais reais na inspeção do projeto. A busca pela senha ativa não encontrou cópias fora de `env/` nem nos blobs do histórico Git alcançável. Isso não detecta necessariamente credenciais antigas desconhecidas. |
| Senhas dos usuários | Hash scrypt com salt por senha no banco; não são exportadas para a pasta env. Segredo de sessão aleatório em memória. Exemplos de teste não são credenciais reais. |
| Exposição de arquivos | Testes HTTP confirmam 404 para `env/.env`, arquivos arbitrários em env, `.git`, backend e outros arquivos privados. Só frontend é servido. |
| SQL injection | Models usam `execute(sql, parametros)`. SQL dinâmico de atualização usa lista fixa de colunas. Dados não são concatenados nos comandos. Comandos múltiplos desativados. |
| Teste com MySQL real | Login com payload SQL recebeu 401; identificador manipulado recebeu 400. Texto contendo `' OR '1'='1' --` foi salvo literalmente em tarefa fictícia, sem ampliar acesso. Isolamento, rollback, edição concorrente e persistência continuaram funcionando. |
| Permissões do banco | `SHOW GRANTS` confirmou SELECT, INSERT, UPDATE e DELETE apenas no banco StudyUp, sem permissões administrativas. Não executamos comandos destrutivos de teste. |
| Portas locais | `ss` confirmou Node na porta 3000 e MySQL nas portas 3306/33060 vinculados a 127.0.0.1 no momento da revisão. |
| Autorização | Dono vem da sessão, consultas restringem por usuário e chave estrangeira composta impede vincular disciplina de outra conta. Frontend não acessa MySQL diretamente. |
| XSS | Campos dinâmicos revisados são inseridos com `textContent`/criação de elementos. Teste no navegador confirmou que título com marcação é texto, não elemento HTML. Não foi encontrada utilização de innerHTML/eval nos módulos revisados. |
| Sessão/CSRF | Testes aprovados para cookies adulterados, token de outra sessão, origem externa, expiração, renovação no login e invalidação no logout. |
| Cadastro | Agora são cinco tentativas por IP/15 minutos, contando sucesso e entradas inválidas, além do máximo de duas operações simultâneas. Sexta tentativa recebe 429 antes de hash/banco. Cabeçalho de IP forjado não contorna o limite. |
| Dependências | `npm audit --omit=dev` consultou o registro e retornou zero vulnerabilidades conhecidas nesta execução; nenhuma dependência adicionada. |

O instalador também recusa criar uma nova configuração quando encontra o `.env` antigo na raiz, para evitar divergência de credenciais. A mudança de pasta não criptografa o arquivo: protege-se o acesso com permissões, exclusão do Git e separação da pasta pública.

## Limites e riscos restantes

- O projeto continua destinado ao ambiente local. HTTP não protege credenciais em trânsito numa rede compartilhada; acesso externo exige HTTPS e revisão da configuração de proxy/cookies.
- Sessões e contadores estão na memória de um único processo. Reiniciar zera os contadores; vários processos não compartilham o bloqueio. O limite por IP não impede abuso distribuído e afeta pessoas que compartilham o mesmo IP.
- As rotas autenticadas não têm quotas de criação de tarefas/disciplinas nem limitação geral de requisições. Um usuário autenticado ainda pode acumular registros ou fazer muitas leituras. Paginação, quotas e proteção de tráfego devem entrar na preparação para publicação.
- Não há política CSP nem bloqueio de incorporação em iframe por cabeçalhos. São endurecimentos pendentes para reduzir impacto de XSS futuro e clickjacking; esta revisão não demonstrou exploração desses riscos.
- O cadastro informa e-mail duplicado, permitindo descobrir se um endereço já possui conta, agora com limite de tentativas. Essa escolha de interface deve ser revista se houver exigência maior de privacidade.
- Não foram realizados testes de carga, DDoS, leitor de tela, auditoria do sistema operacional ou de toda a rede. Zero alertas do npm não significa ausência de falhas desconhecidas.

## Verificação e reprodução

- `npm test`: **54 testes aprovados**, incluindo novas verificações de limite de cadastro, expiração do contador, preservação da configuração antiga e permissões de arquivo/pasta.
- `npm run db:check`: conexão e três tabelas confirmadas após a migração.
- Fluxo integrado no Chrome: **25 verificações aprovadas** após as alterações, com duas contas fictícias e limpeza ao final.
- Testes adicionais de SQL/MySQL utilizaram `/tmp/studyup-injection-audit.mjs`, com credenciais carregadas por `node --env-file=env/.env`. Esse script é temporário e não integra `npm test`.
- Logs temporários: `/tmp/studyup-security-tests.log` e `/tmp/studyup-security-audit.json`. Nenhuma senha foi exibida nos resultados.

Para testar manualmente o limite, use uma instância de teste: envie cinco tentativas de cadastro e confira 429 na sexta. Não é necessário criar contas reais para isso: JSON inválido também conta. Aguarde quinze minutos antes de repetir; em uma sala com IP compartilhado, combine o teste para não impedir cadastros de colegas.

Referências: [OWASP — prevenção de SQL injection](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), que recomenda consultas parametrizadas e privilégios mínimos; [OWASP — negação de serviço](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html), sobre limitar tráfego e consumo de recursos em camadas.
