# Organização dos commits — 05/11/2026

Oito commits locais, com divisão igual: quatro mensagens identificadas por Ícaro e quatro por Laura. Os nomes são etiquetas nas mensagens, conforme combinado; não alteram autor/e-mail do Git nem afirmam quem escreveu individualmente cada trecho. Os commits formam uma sequência de dependências; o estado final integrado é a referência validada.

| Ordem | Mensagem | Escopo |
| --- | --- | --- |
| 1 | feat(auth): implementa contas, sessoes e limites de tentativas [Ícaro] | Model/controller/rotas de autenticação, validação, segurança, dependência express-session e testes. |
| 2 | feat(disciplinas): adiciona API isolada por usuario [Laura] | Model/controller/rotas, validação e testes de disciplinas. |
| 3 | feat(tarefas): adiciona API, prazos e transacoes [Ícaro] | Model/controller/rotas, datas, validação e testes de tarefas. |
| 4 | fix(servidor): integra APIs e protege configuracao local [Laura] | Montagem das APIs, proteção de HTML, migração de caminhos para env/.env, instalador e testes. |
| 5 | feat(auth-ui): conecta cadastro e login ao backend [Ícaro] | Formulários de autenticação, sessão no navegador e CSS. |
| 6 | feat(disciplinas-ui): conecta gerenciamento ao MySQL [Laura] | Interface de disciplinas e estados de feedback. |
| 7 | feat(app): integra tarefas, inicio e agenda aos dados reais [Ícaro] | Store, adaptação de dados, formulários, filtros, layout compartilhado e testes de estado. |
| 8 | docs(entrega): registra testes, seguranca e hospedagem gratuita [Laura] | READMEs, plano MVP, revisão de segurança, este registro e plano de hospedagem. |

Credenciais de env/ não entram nos commits. `.gitkeep` da raiz e `frontend/src/js/pages/authNavigation.js` continuam fora: são arquivos preexistentes não utilizados pela integração e não foram alterados nesta tarefa. Não há push ou deploy nesta organização.
