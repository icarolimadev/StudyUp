# Backend — blocos 7.1 e 7.2

Servidor local Node.js + Express. Entrega o frontend e uma rota de status. O código de conexão MySQL está preparado; consulte o [roteiro de instalação e configuração](database/README.md). Ainda não há autenticação nem persistência das telas, que continuam usando exemplos em memória.

## Executar

Na raiz do projeto, com Node.js 24 ou superior e npm (o ambiente usado nesta etapa possui Node.js 24.18.0):

```sh
npm ci
npm start
```

- Entrada: http://127.0.0.1:3000
- Telas: http://127.0.0.1:3000/views/pages/app.html#inicio
- API: http://127.0.0.1:3000/api/status

`npm run dev` reinicia o servidor ao alterar arquivos acompanhados pelo Node. Para atualizar HTML/CSS no navegador, recarregue a página. `Ctrl+C` encerra o processo. Não é preciso executar o servidor Python junto.

O servidor usa `HOST=127.0.0.1` e `PORT=3000` como padrão. Para mudar, copie `.env.example` para `.env` na raiz e edite os valores. O comando npm carrega esse arquivo quando ele existe. Se a porta estiver ocupada, encerre o outro processo ou escolha outra porta. O endereço padrão atende apenas este computador.

## Arquivos e comunicação

| Arquivo | Responsabilidade |
| --- | --- |
| `server.js` | Lê host/porta e inicia o servidor HTTP. |
| `app.js` | Configura rotas, arquivos públicos e respostas de erro. Importá-lo não abre uma porta. |
| `routes/status-routes.js` | Liga GET /status ao controller; app.js acrescenta /api. |
| `controllers/status-controller.js` | Produz a resposta JSON do status. |
| `tests/app.test.js` | Testa API, entrega dos arquivos e bloqueio de arquivos internos por HTTP real. |
| `../package.json` | Declara Express, módulos JavaScript e comandos npm. |
| `../package-lock.json` | Registra as versões exatas da árvore instalada. |

Fluxo: navegador → GET /api/status → app.js → router → controller → resposta HTTP 200 com JSON.

```json
{"application":"StudyUp","status":"ok","database":"not_configured"}
```

Sem configuração, a resposta acima permanece válida. Com as variáveis DB_* preenchidas, a rota executa SELECT 1 e informa `connected` ou `unavailable` (HTTP 503). Não expõe mensagens internas do banco. Execute `npm run db:check` para verificar também a existência das três tabelas. As Views continuam no frontend; os Models de operações de usuários, disciplinas e tarefas serão implementados nos próximos blocos.

Somente `frontend/` é servido publicamente. Arquivos de backend, configuração e documentação ficam fora da raiz pública.

## Testar

```sh
npm test
```

Os testes abrem uma porta local temporária e a encerram ao terminar; não precisam de `npm start` em paralelo. Um ambiente que proíba sockets locais impedirá esses testes.

Também é possível abrir a rota de status no navegador ou executar:

```sh
curl -i http://127.0.0.1:3000/api/status
```

Conexão MySQL e esquema inicial implementados nos blocos 7.1–7.2. Próximos blocos da etapa 7: cadastro/login/sessão, autorização por usuário e integração das disciplinas/tarefas. Cada bloco será explicado antes de ser implementado.
