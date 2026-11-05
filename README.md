# StudyUp

Projeto escolar de organização de estudos com HTML, CSS, JavaScript, Node.js, Express e MySQL. A conexão e o esquema MySQL estão preparados; siga o [roteiro do banco local](backend/database/README.md) para configurar.

## Executar localmente

Requisitos: Node.js 24 ou superior e npm. Na raiz:

```sh
npm ci
npm start
```

Abra http://127.0.0.1:3000 para a entrada ou http://127.0.0.1:3000/views/pages/auth.html#auth-signup para cadastrar sua conta. Após entrar, a aplicação fica em http://127.0.0.1:3000/views/pages/app.html#inicio. O status do servidor está em http://127.0.0.1:3000/api/status.

Use `npm run dev` para reiniciar o servidor automaticamente durante o desenvolvimento, `npm test` para os testes automatizados e `Ctrl+C` para encerrar. Configuração em `env/.env`, usando `.env.example` como referência; o fluxo de contas e tarefas precisa do MySQL configurado.

## Estado atual

- Início, Tarefas, Adicionar/Editar e Agenda diária integrados às tarefas reais da conta.
- Disciplinas reais por conta: cadastrar, listar, editar e excluir no MySQL. Exclusão bloqueada se houver tarefas vinculadas.
- Filtros por busca, disciplina, prioridade, estado e período, incluindo atrasadas; resumo de total/pendentes/atrasadas/concluídas e próximos prazos.
- Projetos com checklist e Notificações com preferências continuam como demonstração, separados das tarefas reais.
- Prévia interna revisada no Chrome para responsividade, teclado, estados vazios e erros de formulário.
- Servidor Express entrega o frontend e uma rota de status.
- Conexão MySQL configurável por `env/.env` e esquema inicial preparado; verificação com `npm run db:check`.
- Cadastro real em `/views/pages/auth.html#auth-signup`: nome, e-mail único e senha protegida por scrypt no MySQL.
- Login/logout reais, sessão local de até duas horas e Perfil com nome/e-mail da conta. É preciso entrar para abrir a aplicação interna.
- Sessões ficam na memória do servidor durante o desenvolvimento; reiniciá-lo exige novo login. As contas permanecem no MySQL.
- API de tarefas no MySQL: criar, listar, editar, excluir, concluir e reabrir; disciplinas validadas por dono e prazo em horário de Fortaleza.
- Cadastro, edição, exclusão com confirmação, conclusão e reabertura disponíveis na interface. Contas, disciplinas e tarefas permanecem após recarregar ou entrar novamente.
- Envio real de notificações, edição de perfil e visões semanal/mensal da agenda continuam pendentes.

## Organização

- `frontend/`: páginas, estilos e módulos do navegador; única pasta pública.
- `backend/`: servidor, rotas, controllers e testes. Consulte o [guia do backend](backend/README.md).
- `docs/plano-mvp.md`: [registro das etapas, verificações e pendências](docs/plano-mvp.md).

Alguns documentos iniciais em `docs/` ainda descrevem uma estrutura anterior. O registro de progresso e o guia do backend descrevem os blocos implementados atualmente.

## Roteiro rápido de validação

1. Cadastrar e entrar; em Mais → Disciplinas, criar uma disciplina.
2. Em Adicionar, selecionar essa disciplina e salvar uma tarefa.
3. Em Tarefas, editar, concluir/reabrir e experimentar os filtros. Recarregar para conferir persistência.
4. Conferir Início, Agenda diária e o contador da disciplina; excluir a tarefa com confirmação.
5. Entrar com uma segunda conta (por exemplo, em janela anônima) e conferir que sua lista é independente.

Antes da entrega escolar ainda faltam a rodada de testes da equipe em aparelho/rede reais, backup/restauração, evidências e ensaio. Projetos completos, notificações reais, calendário avançado e publicação continuam fora do recorte inicial.
