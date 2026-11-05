# StudyUp

Projeto escolar de organização de estudos com HTML, CSS, JavaScript, Node.js, Express e MySQL. A conexão e o esquema MySQL estão preparados; siga o [roteiro do banco local](backend/database/README.md) para configurar.

## Executar localmente

Requisitos: Node.js 24 ou superior e npm. Na raiz:

```sh
npm ci
npm start
```

Abra http://127.0.0.1:3000 para a entrada ou http://127.0.0.1:3000/views/pages/app.html#inicio para as telas de demonstração. A API inicial está em http://127.0.0.1:3000/api/status.

Use `npm run dev` para reiniciar o servidor automaticamente durante o desenvolvimento, `npm test` para os testes do backend e `Ctrl+C` para encerrar. Configuração opcional em `.env`, usando `.env.example` como referência.

## Estado atual

- Telas de Início, Tarefas, Adicionar tarefa e Disciplinas com exemplos compartilhados em memória.
- Agenda diária, Projetos com checklist, menu Mais, Perfil e Notificações com preferências de demonstração.
- Prévia interna revisada no Chrome para responsividade, teclado, estados vazios e erros de formulário.
- Servidor Express entrega o frontend e uma rota de status.
- Conexão MySQL configurável por `.env` e esquema inicial preparado; verificação com `npm run db:check`.
- Sem autenticação real ou persistência das telas; recarregar restaura os exemplos.
- Envio real de notificações, edição de perfil e visões semanal/mensal da agenda continuam pendentes.

## Organização

- `frontend/`: páginas, estilos e módulos do navegador; única pasta pública.
- `backend/`: servidor, rotas, controllers e testes. Consulte o [guia do backend](backend/README.md).
- `docs/plano-mvp.md`: [registro das etapas, verificações e pendências](docs/plano-mvp.md).

Alguns documentos iniciais em `docs/` ainda descrevem uma estrutura anterior. O registro de progresso e o guia do backend descrevem os blocos implementados atualmente.
