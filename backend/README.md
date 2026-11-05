# Backend — blocos 7.1–7.4

Servidor local Node.js + Express. Entrega o frontend, status, autenticação e APIs de disciplinas/tarefas; consulte o [roteiro de instalação e configuração](database/README.md). Os registros dessas APIs ficam no MySQL; sessões ficam na memória do servidor nesta fase local. Disciplinas, Tarefas, Adicionar/Editar, Início e Agenda diária já usam dados reais. Projetos e Notificações continuam como demonstração.

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

O servidor usa `HOST=127.0.0.1` e `PORT=3000` como padrão. Para mudar, copie `.env.example` para `env/.env` e edite os valores. O comando npm carrega esse arquivo quando ele existe. Se a porta estiver ocupada, encerre o outro processo ou escolha outra porta. O endereço padrão atende apenas este computador.

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

## Cadastro — bloco 7.3a

Abra `/views/pages/auth.html#auth-signup`. O formulário envia JSON para `POST /api/auth/register`, com `name`, `email`, `password` e `password_confirmation`. Nome: até 150 caracteres; e-mail: até 254; senha: 15 a 128 caracteres, sem combinações obrigatórias. O servidor normaliza nome/e-mail e preserva a senha exatamente como digitada.

Fluxo: `auth-routes.js` → `auth-controller.js` → `register-validator.js` → `security/password.js` → `models/user-model.js` → MySQL. A consulta usa parâmetros e a chave única do banco resolve também cadastros simultâneos com o mesmo e-mail. O hash usa scrypt nativo do Node (N=32768, r=8, p=3), salt aleatório de 16 bytes e chave de 64 bytes. Senha e hash nunca fazem parte da resposta HTTP.

Respostas: 201 (criado, sem sessão), 400 (campos ou JSON inválidos), 409 (e-mail duplicado), 413 (corpo acima de 8 KiB), 415 (conteúdo diferente de JSON), 403 (origem externa), 429 (dois cadastros já em processamento) e 503 (falha ao gravar no banco). As respostas não expõem mensagens internas do MySQL. O limite de concorrência é local ao processo; não substitui limitação de tentativas por cliente em uma futura publicação.

`npm test` inclui os testes do cadastro sem banco real; as dependências substituíveis de `createApp` permitem simular sucesso e falhas. A verificação real de cadastro no Chrome/MySQL e sua limpeza estão registradas no plano MVP.

## Login e sessão — bloco 7.3b

Biblioteca adicionada: `express-session` 1.19.0. `npm ci` instala a dependência. Não é necessário mudar o esquema do banco ou preencher um segredo no env/.env: um segredo aleatório é gerado a cada instância local, coerente com sessões que se encerram ao reiniciar.

| Endpoint | Comportamento |
| --- | --- |
| `POST /api/auth/login` | JSON com email/password; verifica scrypt e cria uma sessão, renovando o identificador anterior. 200 no sucesso, 400 na entrada inválida, 401 nas credenciais incorretas, 429 no limite e 503 na falha de banco. |
| `GET /api/auth/me` | Exige sessão; retorna user (id/name/email) e csrfToken. Reconsulta o usuário no banco; conta removida invalida a sessão. |
| `POST /api/auth/logout` | Exige sessão, Content-Type application/json, origem permitida e cabeçalho X-CSRF-Token com o token recebido de /me; destrói a sessão e remove o cookie, retornando 204. |

`security/session.js` configura cookie `studyup.sid` com HttpOnly, SameSite=Lax, Path=/ e validade de duas horas. Secure é automático em HTTPS direto; em HTTP local não é marcado. O servidor verifica também a idade da sessão, mesmo se alguém reutilizar um cookie expirado. Não há trust proxy habilitado. Não publicar atrás de proxy sem revisar HTTPS, armazenamento de sessão e limites de tentativas.

O MemoryStore padrão é exclusivamente para desenvolvimento local. Não é persistente nem adequado para produção. Reiniciar o servidor encerra sessões, mas não apaga usuários. Não foi implementado “lembrar de mim”. O limite de login é dez tentativas por IP em quinze minutos, incluindo tentativas bem-sucedidas, e até duas verificações de senha simultâneas; ambos são locais ao processo. Testes repetitivos devem usar uma instância temporária ou aguardar o prazo.

O cadastro permite cinco tentativas por IP em quinze minutos, incluindo sucessos e entradas inválidas. A sexta recebe HTTP 429 com `Retry-After`, antes de interpretar JSON, calcular hash ou gravar no banco. Até dois cadastros podem calcular hash simultaneamente. Não se confia em `X-Forwarded-For` enviado pelo cliente. O limite é local ao processo, reinicia com o servidor e é compartilhado por pessoas com o mesmo IP; não substitui proteção contra ataques distribuídos.

As credenciais locais ficam em `env/.env`, com pasta 0700 e arquivo 0600. Toda a pasta `env/` é ignorada pelo Git e fica fora de `frontend/`, a única pasta pública. `.env.example` continua na raiz e contém somente exemplos. Senhas de estudantes permanecem como hashes no MySQL; o segredo de sessão é gerado em memória, sem arquivo separado. Consulte a revisão em `docs/seguranca.md` antes de preparar acesso externo.

A senha não é descriptografada: `verifyPassword` recalcula scrypt com o salt/parâmetros armazenados e compara os resultados com timingSafeEqual. E-mail desconhecido executa uma derivação equivalente e recebe a mesma mensagem de senha incorreta. Senha/hash nunca são retornados ao cliente. O cadastro continua sem iniciar sessão automaticamente.

`app.html` exige sessão no servidor (inclusive caminhos codificados equivalentes). O frontend consulta /me antes de exibir as telas e preenche o Perfil usando textContent; nenhuma credencial é armazenada em localStorage. Logout com falha de rede apresenta erro em vez de confirmar uma saída não concluída. Ao retornar de outra aba, a conta é revalidada; se houver troca de usuário, a página recarrega e reinicia os exemplos.

Os testes de `login.test.js` usam dependências substituíveis para simular duas contas, erro de banco e relógio; não consultam nem apagam usuários reais. O roteiro real no Chrome/MySQL está registrado no plano MVP. Próximos blocos: APIs de disciplinas/tarefas com autorização pelo usuário da sessão e integração das telas. Nenhum e-mail de confirmação/recuperação é enviado.

Referências: [express-session](https://expressjs.com/en/resources/middleware/session/) e [timingSafeEqual do Node](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b).

## Disciplinas — bloco 7.4a

Todos os endpoints exigem sessão e usam `request.session.userId` como dono. GET `/api/disciplinas` retorna `{ subjects: [...] }` com id/name/color/pendingCount. O contador consulta somente tarefas pendentes reais vinculadas no banco, sem contar exemplos do frontend.

Escritas exigem JSON, origem permitida e X-CSRF-Token obtido de /api/auth/me:

- POST `/api/disciplinas`: name obrigatório, color opcional (green por padrão). Retorna 201 com `{ subject }`.
- PATCH `/api/disciplinas/:id`: ao menos um dos campos name/color. Retorna 200 com `{ subject }`, inclusive quando os valores não mudam.
- DELETE `/api/disciplinas/:id`: enviar `{}`; retorna 204. A FK bloqueia a exclusão se houver tarefas vinculadas, inclusive concluídas.

Nome é normalizado (espaços nas extremidades/repetidos), limitado a 100 caracteres e único por conta segundo a collation do MySQL. Cores permitidas: green, blue, pink, gold. Campos desconhecidos, incluindo usuario_id, são rejeitados. IDs devem ser inteiros positivos no intervalo INT UNSIGNED. Erros: 400 entrada inválida; 401 sem sessão; 403 origem/token; 404 registro inexistente ou de outro usuário; 409 nome repetido ou vínculo; 503 falha no banco. Respostas não expõem SQL.

Fluxo: subject-routes → subject-controller → subject-validator/subject-model → MySQL. `json-request.js` centraliza a proteção de origem/JSON já usada na autenticação. Cada leitura, alteração e exclusão no model é filtrada pelo dono. `createApp` aceita um terceiro argumento opcional para substituir o model nos testes.

A tela Disciplinas usa `accountRequest` para enviar cookie/token e redirecionar quando a sessão termina. Cadastro e edição reutilizam o formulário; exclusão pede confirmação; falhas preservam a entrada. Os seletores de disciplina das tarefas consultam os registros reais e enviam seus IDs. Não houve mudança de esquema nesta etapa.

## Tarefas — bloco 7.4b

Todos os endpoints exigem sessão. Escritas exigem Content-Type application/json, origem permitida e X-CSRF-Token obtido de /api/auth/me. O corpo JSON é limitado a 40 KiB para acomodar os 5.000 caracteres da descrição, inclusive escapados.

| Operação | Endpoint | Resposta |
| --- | --- | --- |
| Listar | GET /api/tarefas | 200, `{ tasks: [...] }`, ordenadas por prazo crescente e ID. |
| Criar | POST /api/tarefas | 201, `{ task }`. |
| Editar/concluir/reabrir | PATCH /api/tarefas/:id | 200, `{ task }`; enviar somente os campos a alterar. |
| Excluir | DELETE /api/tarefas/:id | 204; enviar `{}`. |

Campos de escrita:

- `title`: obrigatório na criação, texto de 1 a 150 caracteres após trim.
- `deadline`: obrigatório na criação, horário civil de Fortaleza no formato `AAAA-MM-DDTHH:mm` ou `AAAA-MM-DDTHH:mm:ss`, sem Z/offset. Anos 1000–9999; datas impossíveis são rejeitadas.
- `description`: texto de até 5.000 caracteres ou null; padrão null.
- `subjectId`: ID numérico inteiro de uma disciplina da própria conta ou null; padrão null. Enviar null no PATCH remove o vínculo.
- `priority`: baixa/media/alta; padrão media.
- `status`: pendente/concluida; padrão pendente. PATCH com `{ "status": "concluida" }` conclui; com `{ "status": "pendente" }` reabre.

Campos de leitura adicionais: id, subjectName, completedAt e overdue. Datas retornam com segundos e sem offset, sempre no horário civil de Fortaleza. O backend calcula completedAt; o cliente não pode informá-lo nem escolher usuario_id. Uma tarefa está atrasada apenas se pendente e com prazo estritamente anterior ao instante atual. O instante exato do prazo ainda não é atraso. Concluir retira a condição de atraso; reabrir recalcula.

Models usam SQL parametrizado e filtro de dono em todas as consultas. A validação da disciplina não distingue registro inexistente de outra conta, e a FK composta mantém a garantia no banco. Atualizações usam transação e SELECT FOR UPDATE para preservar campos omitidos em edições simultâneas; operações inválidas sofrem rollback. Repetir uma conclusão preserva completedAt; reabrir limpa esse valor. O relógio usa America/Fortaleza explicitamente, independentemente do fuso do processo/MySQL.

Erros: 400 campos/ID/disciplina inválidos ou campos extras; 401 sem sessão; 403 origem/CSRF; 404 tarefa inexistente ou de outro dono; 413 corpo excessivo; 415 formato incorreto; 503 falha de banco. Não existe GET individual nesta versão: a lista já contém os dados necessários à interface. Filtros por disciplina/status/período serão aplicados no frontend sobre a lista restrita ao dono, conforme o plano inicial.

### Testar manualmente com a conta conectada

Depois de entrar em `/views/pages/app.html`, abrir o console do navegador. O helper existente envia o token CSRF sem precisar copiá-lo:

```js
const { accountRequest } = await import('/src/js/components/account-session.js');
const { task } = await accountRequest('/api/tarefas', {
  method: 'POST',
  body: { title: 'Revisar redes', deadline: '2030-05-20T14:30', priority: 'alta', subjectId: null },
});
await accountRequest('/api/tarefas');
await accountRequest(`/api/tarefas/${task.id}`, { method: 'PATCH', body: { status: 'concluida' } });
await accountRequest(`/api/tarefas/${task.id}`, { method: 'PATCH', body: { status: 'pendente' } });
await accountRequest(`/api/tarefas/${task.id}`, { method: 'DELETE' });
```

O exemplo cria um registro real e o exclui no último comando. A tela Tarefas consulta essa API; use Atualizar dados caso a lista já estivesse aberta antes dos comandos. A suíte `npm test` usa models/requisições substituíveis e não altera o banco real; os testes de integração com MySQL e limpeza dos dados temporários estão registrados no plano MVP.

## Integração das telas — bloco 7.5

`frontend/src/js/models/task-store.js` mantém um cache em memória das respostas, consulta tarefas/disciplinas e grava pela API; o MySQL continua sendo a persistência. A fila de gravações e a revisão de leituras impedem que uma resposta antiga sobrescreva uma alteração recente. Erros não são tratados como sucesso e não substituem o estado confirmado.

`task-view.js` adapta os campos da API à apresentação, traduz prioridades e combina filtros por ID de disciplina, busca sem acentos, prioridade, estado e período. Todas/Hoje incluem concluídas; Próximas mostra pendentes de amanhã até sete dias; Atrasadas exige pendência e prazo anterior ao instante atual. Horários seguem Fortaleza e segundos são preservados na edição. O atraso é recalculado para apresentação, sem gravar um status adicional no banco.

O roteador carrega os dados ao entrar nas quatro telas do núcleo e oferece Atualizar dados. Carregamento/falha não aparecem como uma lista vazia. O formulário é reutilizado em `#adicionar?editar=ID`, preserva rascunhos em falhas e não altera o estado de conclusão durante a edição dos campos. Uma tarefa inexistente/de outro dono não abre no formulário. Lembretes continuam indisponíveis e estão desativados; nenhuma preferência não suportada é enviada à API.

Início exibe contadores de todas as tarefas da conta; a semana seleciona somente a lista diária. Próximos prazos mostra até três pendências a partir do instante atual. Agenda diária mostra somente tarefas reais, inclusive concluídas e horários fora da faixa inicial. Projetos e notificações de demonstração não são misturados ao núcleo. Contadores e atraso são recalculados a cada minuto quando a página está visível e nenhum controle interativo está focado, preservando a navegação por teclado.

Testes de apresentação/sincronização estão em `backend/tests/task-view.test.js` para participar do comando npm test já existente. O roteiro de navegador com contas temporárias e as limitações da validação constam no plano MVP.
