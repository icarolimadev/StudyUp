# StudyUp — plano de entrega do MVP em três dias

## Acompanhamento atual — 04/11/2026

Este arquivo passa a registrar as tarefas realizadas e suas verificações. O diagnóstico original abaixo descreve o estado anterior às correções registradas aqui. Planejamento não significa funcionalidade implementada.

### Etapa 1 — corrigir a base visual

**Estado: correções de código concluídas; validação visual no navegador pendente.**

| Tarefa realizada | Arquivos | Resultado |
| --- | --- | --- |
| Conferir os caminhos de CSS corrigidos por Ícaro | `frontend/index.html`, `frontend/views/pages/landing.html`, `frontend/views/pages/auth.html` | Os três documentos apontam para os estilos existentes em `frontend/src/css/`. |
| Corrigir os destinos de autenticação na apresentação | `frontend/views/pages/landing.html` | Login usa `auth.html#auth-login`; cadastro usa `auth.html#auth-signup`. |
| Corrigir a fonte-base | `frontend/src/css/base/variables.css` | Alterada de `6rem` para `1rem`. |
| Remover fechamento SVG excedente | `frontend/index.html` | Removido um `</svg>` duplicado da marca. |
| Revalidar o código em 04/11/2026 | HTML e CSS existentes | 28 referências locais válidas, fragmentos com destinos existentes, imports CSS existentes, tags SVG equilibradas e fonte-base confirmada. |
| Centralizar o acompanhamento | `docs/plano-mvp.md` | Registro das tarefas, verificações e próximos passos, preservando o plano original. |

As três correções foram aplicadas após autorização na conversa anterior e reconferidas nesta etapa; não foi necessário reaplicá-las. A verificação estática não comprova aparência ou responsividade. Autenticação e persistência ainda não estão implementadas.

Para finalizar a validação visual:

1. Executar `python3 -m http.server 8000 --directory frontend` na raiz do projeto.
2. Abrir `http://localhost:8000` e conferir os estilos.
3. Percorrer Começar → Criar conta, Já tenho uma conta e Esqueceu a senha, verificando os painéis de destino.
4. Conferir em largura de 360 px e em computador: textos legíveis, botões acessíveis e ausência de rolagem horizontal.
5. Verificar erros de carregamento no navegador e registrar o resultado neste arquivo.

### Etapa 2 — estrutura compartilhada (04/11/2026)

**Estado: implementação concluída; validação visual no navegador pendente.**

Implementação autorizada na conversa. Foram mantidos HTML, CSS e JavaScript puro, com execução local e sem integração de autenticação ou banco nesta etapa.

| Tarefa realizada | Arquivo | Papel e resultado |
| --- | --- | --- |
| Criar a página interna de prévia | `frontend/views/pages/app.html` | Cabeçalho, marca, área principal, cinco painéis provisórios e navegação inferior compartilhada. Ícones SVG locais, sem dependências externas. |
| Estilizar a estrutura | `frontend/src/css/layouts/app-layout.css` | Cores existentes, cartões, limites de largura, foco visível, áreas seguras e espaço inferior reservado à barra fixa. Classes App isolam os estilos das telas anteriores. |
| Conectar os estilos | `frontend/src/css/main.css` | Importa a folha de layout junto aos estilos compartilhados. |
| Implementar navegação da prévia | `frontend/src/js/layouts/app-layout.js` | Seleciona painel pelo fragmento, atualiza título e aria-current, trata fragmento desconhecido com Início e acompanha hashchange. Ao trocar de painel, move o foco ao título. |
| Conferir arquivos e lógica | Verificações temporárias, sem arquivos de teste adicionados | Sintaxe JavaScript e git diff --check aprovados; 48 referências locais válidas, imports CSS existentes e IDs únicos por documento. Teste com DOM simulado aprovou os cinco destinos, seleção única, título, fallback e preservação do painel no link de pular para conteúdo. |

**Limite da verificação:** tentativa de iniciar servidor HTTP e Chrome headless foi bloqueada pelo ambiente com “Operation not permitted”. Não foram verificadas renderização, dimensões, foco real nem navegação real pelo histórico. O teste simulado não substitui essas verificações.

**Roteiro de teste manual:**

1. Executar `python3 -m http.server 8000 --directory frontend` na raiz.
2. Abrir `http://localhost:8000/views/pages/app.html`.
3. Alternar Início, Agenda, Adicionar, Projetos e Mais. Conferir título, aba destacada e um único painel visível.
4. Usar Voltar/Avançar e abrir diretamente `app.html#projetos`; deve selecionar o painel correspondente. Um fragmento desconhecido deve exibir Início.
5. Navegar com Tab/Enter e testar “Pular para o conteúdo”. Conferir foco visível.
6. Testar larguras de 360 px e 1280 px, zoom de 200% e janela baixa. Conferir ausência de rolagem horizontal e acesso ao fim do conteúdo acima da barra.

As mensagens “Em breve” e a etiqueta “Prévia” identificam os painéis provisórios. Não há dados falsos apresentados como persistidos. O menu Mais completo e os conteúdos de cada tela permanecem nas próximas etapas. A página está acessível diretamente para estudo, sem simular login.

### Etapa 3 — tela Início (04/11/2026)

**Estado: implementação e verificações de código concluídas; conferência visual pendente.**

Etapa autorizada na conversa. A tela usa exemplos claramente identificados, mantidos somente em memória. Não representa autenticação, API, banco ou conclusão persistente de tarefas.

| Tarefa realizada | Arquivo | Resultado |
| --- | --- | --- |
| Substituir o painel provisório de Início | `frontend/views/pages/app.html` | Saudação, data, aviso de demonstração, faixa semanal, contadores, tarefas e próximos prazos. Nome genérico até existir sessão real. |
| Estilizar o painel conforme as referências | `frontend/src/css/pages/inicio.css` | Verde e amarelo suave, cartões, estados concluído/vazio, detalhes expansíveis, foco visível e duas colunas em telas maiores. |
| Conectar a nova folha de estilos | `frontend/src/css/main.css` | Import de `pages/inicio.css`. |
| Separar dados e cálculos da apresentação | `frontend/src/js/models/inicio-demo.js` | Exemplos relativos à data atual em Fortaleza, semana de segunda a domingo, filtros e ordenação. Sem acesso ao DOM. |
| Implementar as interações da tela | `frontend/src/js/pages/inicio.js` | Seleção do dia, atualização dos totais/lista, conclusão e reabertura em memória, detalhes nativos e avisos acessíveis. Conteúdo textual inserido por textContent. |
| Integrar com a estrutura existente | `frontend/src/js/layouts/app-layout.js` | Inicializa Início uma vez e mantém o título do navegador como “Início”, independentemente da saudação. |

**Regras da demonstração:** os contadores mostram o total de atividades do dia selecionado, incluindo concluídas. Hoje começa com 3 tarefas, 1 prova, 2 projetos e 1 evento. “Próximos prazos” mostra até três pendências a partir de hoje, ordenadas por data/horário, independentemente do dia selecionado na faixa semanal. Marcar uma tarefa altera sua aparência e a lista de prazos, mas não reduz o total de atividades cadastradas. Recarregar restaura os exemplos. Esses exemplos não implementam os módulos de provas, eventos ou projetos.

**Verificações executadas:** sintaxe dos três módulos JavaScript e git diff --check; referências locais HTML, IDs únicos e imports CSS/JS. Testes temporários dos cálculos passaram para fuso de Fortaleza na virada do dia, virada de ano, ano bissexto, semana de segunda a domingo, totais por tipo, dia vazio, exclusão das concluídas dos prazos e reabertura. Não foram adicionados arquivos permanentes de testes.

**Limite:** não houve validação visual nem teste de interação em navegador nesta etapa. A execução do servidor/Chrome foi bloqueada pelo ambiente na etapa anterior; as verificações acima não comprovam aparência, foco real ou dimensões.

**Roteiro manual:**

1. Executar `python3 -m http.server 8000 --directory frontend` e abrir `http://localhost:8000/views/pages/app.html#inicio`.
2. Conferir data e dia da semana; hoje deve estar marcado e selecionado.
3. Selecionar outros dias: os totais e as tarefas devem acompanhar a seleção; dias sem tarefas mostram mensagem própria.
4. Voltar a hoje, concluir “Finalizar relatório” e conferir texto riscado e retirada dos próximos prazos. Desmarcar deve reabrir e devolver a tarefa à lista de prazos.
5. Abrir detalhes pela seta ou pelo título e conferir prioridade/data. Recarregar para verificar a restauração dos exemplos.
6. Alternar Agenda → Início e usar Voltar/Avançar. Confirmar que a saudação não altera o título “Início | StudyUp”.
7. Testar com teclado, largura de 360 px, computador e zoom de 200%; conferir legibilidade, foco e acesso ao último prazo acima da barra inferior.

O acesso “Ver todas” será conectado quando a tela de tarefas existir. Perfil e botão flutuante duplicado não foram adicionados nesta etapa. O próximo passo é a lista de Tarefas, conforme o plano.

### Etapa 4 — tela Tarefas (04/11/2026)

**Estado: implementação e verificações de código concluídas; conferência visual pendente.**

Etapa autorizada na conversa. Mantém dados de demonstração em memória, sem API, autenticação ou persistência.

| Tarefa realizada | Arquivos | Resultado |
| --- | --- | --- |
| Montar a tela e seus acessos | `frontend/views/pages/app.html` | Painel Tarefas com quatro filtros de período/conclusão, busca, seletores de disciplina/prioridade, contagem, limpeza de filtros e lista. Acesso por “Ver todas” no Início e link em Mais. |
| Estilizar a lista conforme os prints | `frontend/src/css/pages/tarefas.css`, `frontend/src/css/main.css` | Cartões, prioridades com cor e texto, estado concluído, controles responsivos e foco visível. |
| Separar regras de filtragem da interface | `frontend/src/js/models/tarefas-model.js` | Combina período, disciplina, prioridade e busca sem distinguir caixa ou acentos; ordena por data/horário sem modificar a lista original. |
| Compartilhar os exemplos entre telas | `frontend/src/js/models/demo-state.js`, `frontend/src/js/models/inicio-demo.js` | Uma única lista em memória e data de referência em Fortaleza. Incluído exemplo de tarefa com prioridade baixa. |
| Implementar interações de Tarefas | `frontend/src/js/pages/tarefas.js` | Renderização com textContent, filtros, resultado vazio, conclusão/reabertura e recuperação de foco após atualização da lista. |
| Atualizar telas ao navegar | `frontend/src/js/pages/inicio.js`, `frontend/src/js/layouts/app-layout.js` | Início e Tarefas são atualizados ao entrar no painel; mudanças feitas em uma tela aparecem na outra. |

**Regras explícitas:** Todas inclui pendentes e concluídas. Hoje inclui todas as tarefas da data atual da demonstração. Próximas inclui somente pendentes de amanhã até sete dias à frente, inclusive. Concluídas permite reabrir desmarcando a caixa. Todos os filtros combinam entre si; a busca consulta título e disciplina. Limpar filtros também retorna a Todas. Os estados dos filtros são mantidos ao navegar entre painéis; recarregar restaura os exemplos.

**Verificações executadas:** sintaxe JavaScript, git diff --check, referências locais, IDs únicos e imports CSS/JS. Testes temporários passaram para filtros combinados, busca sem acentos/caixa, prioridade baixa, resultado vazio, limite de sete dias, preservação da lista original, conclusão/reabertura, reflexo nos próximos prazos e identidade do estado compartilhado entre imports.

**Limite:** não foram executados testes reais em navegador nesta etapa. O bloqueio de servidor/Chrome registrado anteriormente permanece como limitação da conferência visual. Os testes de lógica não comprovam foco real, histórico ou dimensões.

**Roteiro manual:**

1. Executar `python3 -m http.server 8000 --directory frontend` e abrir `http://localhost:8000/views/pages/app.html#tarefas`.
2. Conferir seis tarefas em Todas; três em Hoje; três em Próximas; uma em Concluídas, com exemplos recém-carregados.
3. Buscar “relatorio” sem acento; deve encontrar “Finalizar relatório”. Combinar disciplina e prioridade; conferir também uma combinação sem resultados.
4. Usar Limpar filtros: todos os campos devem retornar ao padrão e Todas deve ficar selecionada.
5. Concluir uma tarefa, voltar ao Início e conferir seu estado. Fazer a alteração inversa no Início e retornar a Tarefas.
6. Na aba Concluídas, reabrir uma tarefa: ela deve desaparecer dessa lista e o foco deve ir a uma caixa remanescente ou ao filtro ativo.
7. Conferir acesso por Ver todas e Mais → Tarefas, navegação por teclado e Voltar/Avançar.
8. Testar largura de 360 px, computador e zoom de 200%; conferir filtros, texto e último cartão acima da navegação inferior.

Próxima etapa: formulário de Adicionar atividade, começando pelo tipo tarefa. Nenhum cadastro, edição ou exclusão foi implementado nesta etapa.

### Etapa 5 — adicionar tarefa (04/11/2026)

**Estado: implementação e verificações de código concluídas; conferência no navegador pendente.**

Etapa autorizada na conversa. Cadastro apenas de tarefas na lista compartilhada em memória; recarregar apaga as alterações. Projeto, Prova e Evento aparecem como “Em breve”, sem controles de cadastro simulados.

| Tarefa realizada | Arquivos | Resultado |
| --- | --- | --- |
| Criar formulário inspirado nos prints | `frontend/views/pages/app.html` | Título, descrição, disciplina opcional, data, horário, prioridade, preferência de lembrete, mensagens de erro/sucesso e acesso à lista após salvar. |
| Estilizar formulário | `frontend/src/css/pages/adicionar.css`, `frontend/src/css/main.css` | Campos, opções de prioridade com radios nativos, interruptor de lembrete, botão Salvar e adaptação de largura. |
| Validar e criar tarefas | `frontend/src/js/models/tarefas-model.js` | Valida antes de inserir; título de 1–150 caracteres, descrição até 5.000, data real, horário válido, disciplina conhecida ou vazia, prioridade permitida e antecedência válida. Cria ID único na lista e estado pendente. |
| Controlar o formulário | `frontend/src/js/pages/adicionar.js` | Coleta dados, chama o modelo, mantém os campos em caso de erro e os limpa após sucesso. Erros são associados aos campos; foco vai ao primeiro erro ou à confirmação. |
| Compartilhar disciplinas da demonstração | `frontend/src/js/models/demo-state.js` | Lista derivada dos exemplos, reutilizada no cadastro e nos filtros. A gestão real de disciplinas fica para a etapa 6. |
| Integrar cadastro com navegação e listas | `frontend/src/js/layouts/app-layout.js`, `frontend/src/js/pages/tarefas.js`, `frontend/src/js/pages/inicio.js` | Tarefas cadastradas aparecem nas listas/contadores correspondentes; descrição e preferência de lembrete aparecem nos detalhes de Tarefas. Disciplina vazia é exibida como “Sem disciplina”. O acesso após cadastro limpa os filtros para não ocultar a tarefa nova. |

**Decisões desta etapa:** data e horário formam o prazo obrigatório, no horário de Fortaleza; o horário começa em 23:59 e pode ser alterado. Datas passadas são aceitas, sem adicionar uma restrição não prevista no PDF. A prioridade começa em Média. A descrição tem limite de 5.000 caracteres nesta prévia. O lembrete começa desativado; quando ativado, aceita 30 minutos, 1 hora, 1 dia ou 2 dias de antecedência. Sua preferência é guardada no registro em memória, mas não existe agendamento nem envio de notificações. A página informa essa limitação.

**Verificações executadas:** sintaxe JavaScript, git diff --check, referências HTML, labels, IDs e imports CSS/JS. Testes temporários do modelo passaram para título vazio/espaços/excedente, descrição excedente, disciplina inválida ou opcional, data impossível e bissexto, horário inválido, prioridade inválida, antecedência inválida e válida, IDs únicos e inclusão nas consultas de tarefas do dia, próximos prazos e busca. Entradas inválidas não alteraram a lista. Dados textuais são exibidos com textContent.

**Limite:** não houve execução de navegador nesta etapa; o bloqueio de servidor/Chrome foi registrado anteriormente. As verificações não comprovam aparência, validação nativa no navegador, foco real nem sequência de cliques. A validação futura no backend continua necessária.

**Roteiro manual:**

1. Executar `python3 -m http.server 8000 --directory frontend` e abrir `http://localhost:8000/views/pages/app.html#adicionar`.
2. Tentar salvar sem título; depois tentar título apenas com espaços. Confirmar que nenhuma tarefa é adicionada e que o erro é compreensível.
3. Preencher título, descrição, disciplina, data de hoje, horário e prioridade Alta. Ativar lembrete, escolher antecedência e salvar. Conferir mensagem de demonstração e limpeza do formulário.
4. Abrir Ver tarefas: conferir o registro, prioridade, data, horário e detalhes. Os filtros anteriores devem estar limpos.
5. Ir ao Início e selecionar hoje: conferir a nova tarefa e o contador. Concluir/reabrir e conferir o reflexo nas duas telas.
6. Cadastrar outra tarefa sem disciplina e sem lembrete. Conferir “Sem disciplina” e ausência de preferência de lembrete.
7. Alternar entre painéis antes de salvar: o rascunho deve permanecer. Recarregar depois de salvar: exemplos iniciais devem ser restaurados, conforme o aviso.
8. Testar teclado, largura de 360 px, zoom de 200% e teclado virtual; o botão Salvar deve continuar acessível por rolagem.

Próxima etapa: Disciplinas, com lista e formulário de cadastro. Backend e persistência continuam planejados para a etapa 7.

### Etapa 6 — Disciplinas (04/11/2026)

**Estado: lista, cadastro e integração em memória implementados; conferência no navegador pendente.**

Etapa autorizada na conversa, conforme o recorte de lista e formulário. Os dados continuam temporários e são restaurados ao recarregar.

| Tarefa realizada | Arquivos | Resultado |
| --- | --- | --- |
| Criar a tela e acesso pelo menu Mais | `frontend/views/pages/app.html` | Cartões de disciplinas, contagem de atividades pendentes, próxima atividade, botão Nova disciplina, formulário expansível com nome/cor e ação Cancelar. |
| Aplicar o visual dos prints | `frontend/src/css/pages/disciplinas.css`, `frontend/src/css/main.css` | Cartões arredondados, ícones coloridos, separador do próximo prazo, formulário e grade de duas colunas em telas maiores. |
| Separar regras do cadastro e resumos | `frontend/src/js/models/disciplinas-model.js` | Valida nome de 1–100 caracteres e cor; normaliza espaços e impede duplicatas ignorando caixa/acentos; calcula pendências e próxima atividade. |
| Criar lista independente de disciplinas | `frontend/src/js/models/demo-state.js` | Disciplinas existem sem atividades; getDemoSubjects passa a ler essa lista, compartilhada pelo cadastro de tarefas e filtros. Os exemplos existentes mantêm seus vínculos. |
| Implementar interações | `frontend/src/js/pages/disciplinas.js` | Abre/cancela formulário, valida, exibe erro/sucesso e renderiza cartões usando textContent. Foco retorna ao botão após salvar/cancelar e vai ao campo inválido quando necessário. |
| Atualizar resumos na navegação | `frontend/src/js/layouts/app-layout.js` | Ao entrar em Disciplinas, recalcula resumos para refletir tarefas adicionadas, concluídas ou reabertas nas demais telas. |

**Regras da prévia:** o nome é obrigatório e a cor começa em verde; são oferecidas verde, azul, rosa e amarelo. Duplicatas são rejeitadas como proteção de cadastro nesta demonstração (essa decisão deverá ser alinhada às regras do backend). Pendências incluem todas as atividades não concluídas vinculadas à disciplina, inclusive de datas passadas. “Próxima atividade” considera apenas pendentes datadas de hoje em diante, ordenadas por data/horário; não compara o horário atual. Sem candidatas, exibe “Nenhuma atividade prevista”.

Os registros de disciplina têm IDs próprios, mas as atividades ainda se vinculam pelo nome na demonstração. A migração para `disciplina_id` e chave estrangeira será feita na etapa de banco. Edição e exclusão de disciplinas ainda não foram implementadas; permanecem pendentes para completar o escopo funcional descrito no plano original.

**Verificações executadas:** sintaxe dos módulos JavaScript, git diff --check, referências HTML, labels, IDs e imports CSS/JS. Testes temporários passaram para nomes vazios/longos/duplicados, normalização de espaços/acentos, cor inválida/padrão, IDs únicos, disciplina sem atividade, cadastro de tarefa em nova disciplina, filtro por disciplina, retirada de concluídas dos resumos, preservação da ordem original, seleção cronológica da próxima atividade e consistência dos vínculos dos exemplos existentes.

**Limite:** não foi executado navegador nesta etapa. Renderização, foco real, validação nativa e sequência de cliques permanecem pendentes de verificação manual; o bloqueio de servidor/Chrome está registrado nas etapas anteriores.

**Roteiro manual:**

1. Executar `python3 -m http.server 8000 --directory frontend` e abrir `http://localhost:8000/views/pages/app.html#disciplinas`, ou acessar Mais → Disciplinas.
2. Conferir cartões e resumos; abrir Nova disciplina, preencher um nome e cancelar. Confirmar que nada foi cadastrado.
3. Tentar nome vazio, apenas espaços e uma duplicata como “fisica”. Conferir mensagens e preservação do formulário.
4. Cadastrar “Química” com cor rosa. Conferir cartão com zero pendências e nenhuma atividade prevista.
5. Ir a Adicionar, selecionar Química e salvar uma tarefa para hoje. Retornar a Disciplinas: o cartão deve mostrar uma pendência e a tarefa como próxima atividade.
6. Em Tarefas, filtrar Química, concluir a tarefa e retornar a Disciplinas. Conferir zero pendências; reabrir e verificar o retorno da pendência.
7. Alternar páginas com um rascunho aberto; confirmar sua preservação. Recarregar para conferir restauração dos exemplos, conforme o aviso.
8. Conferir teclado, foco, largura de 360 px, computador, zoom de 200% e acesso ao último cartão e ao formulário acima da navegação inferior.

Próxima etapa planejada: integração do núcleo com Node.js/Express e MySQL. Pela mentoria, começar com servidor HTTP mínimo antes de autenticação e persistência, apresentando as alterações para autorização.

### Etapa 7 — backend e integração (iniciada em 04/11/2026)

**Estado: bloco 7.1 concluído — servidor HTTP local. A etapa 7 completa permanece em andamento.**

Conforme o formato de mentoria, a integração foi dividida em blocos pequenos. Este primeiro bloco prepara Express, rotas e controllers, sem implementar MySQL, contas ou persistência de uma vez.

| Tarefa realizada | Arquivos | Resultado |
| --- | --- | --- |
| Configurar dependências e comandos | `package.json`, `package-lock.json` | Express 5.2.1, módulos ES, comandos start/dev/test e dependências travadas. Ambiente verificado: Node.js 24.18.0; requisito adotado: Node.js 24+. |
| Documentar configuração local | `.env.example` | HOST=127.0.0.1 e PORT=3000. Arquivo .env opcional; nenhum segredo incluído. |
| Implementar inicialização | `backend/server.js` | Inicia HTTP, valida a porta, explica porta ocupada e encerra por SIGINT/SIGTERM. |
| Configurar Express | `backend/app.js` | Registra API, serve apenas frontend por caminho absoluto, retorna 404 e trata falhas internas sem expor stack trace. |
| Criar rota e controller de status | `backend/routes/status-routes.js`, `backend/controllers/status-controller.js` | GET /api/status responde 200 com application=StudyUp, status=ok e database=not_configured. |
| Adicionar testes HTTP | `backend/tests/app.test.js` | Testes reais em porta temporária local para API, arquivos públicos, 404, arquivos internos e falhas de inicialização. |
| Atualizar instruções | `README.md`, `backend/README.md` | Execução por npm, mapa de arquivos, fluxo de requisição, testes e limites atuais. |

**Instalação e testes:** a instalação offline falhou apesar de entradas no cache; a rede restrita também impediu o download. Com a permissão de execução ampliada, o npm instalou Express e dependências (68 pacotes), usando cache temporário e scripts de instalação desativados. Os testes no ambiente restrito falharam; executados com permissão para HTTP local, os seis testes passaram. Foram verificados também sintaxe do servidor e git diff --check. Nenhum serviço de desenvolvimento ficou rodando após os testes; suas portas temporárias foram fechadas.

**O que foi comprovado:** GET /api/status retorna o JSON esperado; HTML, CSS e módulo principal são entregues pelo Express; rotas inexistentes/métodos não implementados retornam 404; backend, .env, Git, documentação e node_modules não são expostos; portas inválidas e ocupadas produzem mensagens de erro sem anunciar sucesso.

**Limites:** não houve avaliação visual em navegador. A rota de status não testa um banco; informa explicitamente que ele não está configurado. As telas continuam com dados em memória. Não há login real, sessão, APIs de disciplinas/tarefas nem Models de banco implementados neste bloco.

**Roteiro de execução e aprendizado:**

1. Na raiz, executar `npm ci` se as dependências ainda não estiverem instaladas e depois `npm start`.
2. Abrir `http://127.0.0.1:3000/api/status`; conferir application, status e database.
3. Abrir `http://127.0.0.1:3000/views/pages/app.html#inicio`; o Express agora serve as telas sem precisar do servidor Python.
4. Abrir `http://127.0.0.1:3000/api/inexistente` e conferir HTTP 404 nas ferramentas do navegador.
5. Percorrer o código: server.js → app.js → status-routes.js → status-controller.js. Entender que response.json devolve dados ao cliente e que importar app.js não abre uma porta.
6. Executar `npm test` para repetir os seis testes. Encerrar o servidor manual com Ctrl+C.

**Próximos blocos da etapa 7:**

- [x] 7.1. Servidor Express local, arquivos públicos, rota/controller de status e testes HTTP.
- [x] 7.2. Preparar MySQL, esquema inicial e conexão do backend (validado no servidor real em 04/11/2026).
- [ ] 7.3. Cadastro, hash de senha, login/logout e sessão.
- [ ] 7.4. APIs de disciplinas e tarefas, validações e autorização por usuário; completar edição/exclusão previstas.
- [ ] 7.5. Integrar frontend à API, substituir dados de demonstração e testar persistência/separação entre contas.

Referências técnicas consultadas: [instalação do Express](https://expressjs.com/en/starter/installing/), [servidor inicial](https://expressjs.com/en/starter/hello-world/) e [arquivos estáticos](https://expressjs.com/en/starter/static-files/).

### Bloco 7.2 — preparação do MySQL (04/11/2026)

**Estado atualizado: bloco 7.2 concluído. MySQL instalado, esquema e usuário configurados; conexão, API e restrições validadas no servidor real em 04/11/2026. As anotações de pendências abaixo são o histórico anterior a essa validação.**

**Verificação após instalação pelo usuário (04/11/2026):** `mysql --version` confirmou MySQL 8.4.11 e `systemctl is-active mysql` retornou `active`. O teste local recebeu “Access denied for user 'icaro'@'localhost' (using password: NO)”: o servidor responde, mas esse acesso sem senha não está autorizado. O ambiente restrito bloqueou inicialmente o socket; a conferência do serviço foi feita com permissão ampliada. Nenhum banco, usuário ou credencial foi criado nessa verificação. A instalação pendente nas anotações históricas abaixo foi resolvida pelo usuário; continuam pendentes aplicar o esquema, criar o usuário da aplicação, preencher .env e executar db:check com sucesso.

O usuário esclareceu que deseja continuar a etapa 7 com MySQL, em vez de construir a Agenda, e autorizou instalar MySQL neste computador. Nenhum arquivo da Agenda foi alterado.

| Tarefa realizada | Arquivos | Resultado |
| --- | --- | --- |
| Verificar ambiente | Comandos de diagnóstico | Ubuntu 26.04; mysql/mysqld não encontrados. Pacote disponível: mysql-server 8.4.11. |
| Tentar instalar MySQL | `sudo -n apt-get install -y mysql-server` | Não instalado: sudo exige autenticação interativa. Solicitado ao usuário executar a instalação no próprio terminal; nenhuma senha foi pedida pelo chat. |
| Instalar driver Node.js | `package.json`, `package-lock.json` | mysql2 3.24.6 instalado com versão exata. Não é outro banco: é o cliente usado para comunicar com MySQL. |
| Preparar conexão | `backend/config/database.js` | Valida configuração, cria pool limitado sob demanda, consulta SELECT 1 e encerra conexões. Sem credenciais não tenta acessar banco. |
| Preparar esquema | `backend/database/schema.sql` | usuarios, disciplinas e tarefas; chaves primárias/estrangeiras, e-mail único, disciplina única por usuário, vínculo de tarefa com disciplina do mesmo dono e restrições de conclusão. Não executado em MySQL ainda. |
| Verificar conexão e tabelas | `backend/scripts/check-database.js` | Comando npm run db:check executa SELECT 1 e verifica existência das três tabelas sem modificar registros. |
| Integrar status e encerramento | `backend/controllers/status-controller.js`, `backend/server.js` | Estado not_configured/connected/unavailable; 503 para indisponibilidade; fecha pool ao encerrar servidor. |
| Orientar configuração segura | `.env.example`, `backend/database/README.md`, `backend/README.md`, `README.md` | Roteiro local para instalar serviço, criar esquema/usuário restrito e preencher .env sem expor senha. |
| Adicionar testes de configuração | `backend/tests/database-config.test.js`, `backend/tests/app.test.js` | Casos de ausência/configuração parcial, porta inválida e opções do pool; testes HTTP isolados de credenciais MySQL. |

**Verificações:** nove testes passaram com permissão para sockets locais (seis de HTTP/inicialização e três de configuração). Sintaxe e git diff --check passaram. npm run db:check informou corretamente banco não configurado. Não foi comprovada conexão real, execução do SQL, constraints no servidor, nem integração das telas com banco. Não apresentar esses testes como validação de MySQL funcionando.

**Decisões do esquema:** campos de auditoria usam TIMESTAMP, em vez do DATETIME sugerido no PDF; prazo e conclusão permanecem DATETIME. E-mail é único; nomes de disciplinas são únicos por usuário, alinhados à proteção de duplicatas da prévia. Exclusões com vínculos são bloqueadas. A chave composta de disciplina e usuário reforça a separação, mas a autorização das futuras consultas ainda é obrigatória. Somente as três tabelas do núcleo foram preparadas; lembretes e outros módulos continuam fora deste bloco.

**Pendência do usuário:** executar `sudo apt-get install mysql-server` e `sudo systemctl enable --now mysql` no próprio terminal. Em seguida, seguir `backend/database/README.md` para aplicar o esquema e configurar o usuário e .env, ou retomar a mentoria para fazer cada passo acompanhado. Nunca enviar senhas no chat.

**Próxima verificação:** após instalação/configuração, executar npm run db:check e abrir /api/status para comprovar conexão. O bloco 7.2 só deve ser marcado concluído depois de validar também o esquema no servidor real.

Referências: [driver MySQL2](https://sidorares.github.io/node-mysql2/docs) e [chaves estrangeiras no MySQL 8.4](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html).

### Configuração assistida do banco — continuação do bloco 7.2 (04/11/2026)

O usuário autorizou aplicar o esquema, criar o usuário exclusivo da aplicação e configurar `.env`. A consulta administrativa prévia via `sudo -n mysql` foi impedida por autenticação interativa obrigatória. Não houve rejeição de aprovação automática; falta autenticar sudo no terminal do usuário.

| Tarefa realizada | Arquivos | Resultado |
| --- | --- | --- |
| Preparar configuração assistida | `backend/scripts/setup-database.js`, `package.json` | `npm run db:setup` verifica usuário existente, aplica o esquema, cria studyup_app com SELECT/INSERT/UPDATE/DELETE e gera senha aleatória em .env com permissão 0600. Não imprime segredo nem o passa como argumento. |
| Preservar configurações existentes | Mesmo script | Recusa execução se .env ou usuário studyup_app já existem. Preserva .env em falha parcial para recuperação, sem tentar apagar banco ou conta. |
| Documentar execução | `backend/database/README.md` | Orienta sudo -v seguido de npm run db:setup como usuário normal. Explica alternativa manual e recuperação de falha parcial. |
| Testar proteções do script | `backend/tests/database-setup.test.js` | Quatro testes com sudo simulado verificam senha não exposta, permissão 0600, preservação de .env e interrupção quando usuário existe ou autenticação falha. Não alteram MySQL real. |

**Resultado:** 13 testes passaram (HTTP, configuração e setup simulado); sintaxe e git diff --check verificados. A tentativa real de setup neste ambiente foi interrompida antes de gerar .env por falta de autenticação administrativa. Esquema e conta ainda não foram aplicados pelo agente.

**Ação pendente no terminal do usuário:** na raiz do StudyUp, executar `sudo -v` e `npm run db:setup`. Depois, retomar para executar db:check e validar schema/constraints no MySQL real. Não solicitar ou enviar senha no chat. A autorização para a configuração já foi concedida e não precisa ser repetida.

### Validação real do MySQL — fechamento do bloco 7.2 (04/11/2026)

Após o usuário informar a conclusão de `db:setup`, foi executado `npm run db:check` com permissão de rede local: conexão OK e tabelas usuarios, disciplinas e tarefas encontradas. O primeiro teste no ambiente restrito não conseguiu conectar; isso era uma restrição do ambiente, não falha de credenciais.

**Proteção da configuração:** `.env` pertence a icaro, possui permissão 0600 e é ignorado pelo Git. Nenhuma credencial foi exibida. O usuário da aplicação possui SELECT, INSERT, UPDATE e DELETE no banco studyup, sem permissão de criação ou concessão de privilégios.

**Testes reais executados:**

- E-mail duplicado e nome de disciplina duplicado para o mesmo usuário são recusados.
- Uma tarefa não pode usar disciplina de outro usuário.
- Título composto apenas de espaços é recusado.
- Disciplina com tarefa vinculada não pode ser excluída.
- Concluir sem preencher concluida_em é recusado; concluir corretamente e reabrir funcionam.
- Tarefa sem disciplina é aceita.
- GET /api/status retorna HTTP 200 e `database: connected`.

Os registros foram criados em uma transação e removidos por ROLLBACK. A ausência dos usuários de teste foi confirmada; os registros relacionados também foram desfeitos. Sequências AUTO_INCREMENT podem ter avançado, comportamento normal do MySQL mesmo com rollback. O teste usou um script temporário em /tmp, sem credenciais embutidas, e encerrou conexões e servidor HTTP de teste.

**Resultado:** conexão e esquema inicial comprovados. As telas continuam em memória; cadastro/login, sessão, autorização da API e persistência das atividades ainda precisam ser implementados. Próximo bloco: 7.3 — autenticação, começando pelo cadastro com hash de senha, em uma pequena etapa explicada antes da edição.

### Etapa 8 — Agenda diária (04/11/2026)

**Estado: visão diária implementada e verificada no Chrome. Semana e Mês permanecem futuros.**

O usuário autorizou a etapa 8 e sua continuação. A Agenda usa os mesmos exemplos em memória das demais telas; não altera os blocos de autenticação e persistência ainda pendentes na etapa 7.

| Tarefa realizada | Arquivos | Resultado |
| --- | --- | --- |
| Montar Agenda diária | `frontend/views/pages/app.html` | Data selecionável, dia anterior/próximo, Hoje, indicação das visões futuras e linha de horários com estado vazio. |
| Separar seleção e agrupamento de dados | `frontend/src/js/models/agenda-model.js` | Valida datas reais e agrupa atividades do dia por horário, sem alterar a lista original. |
| Implementar apresentação e interação | `frontend/src/js/pages/agenda.js` | Exibe tarefas, provas, projetos e eventos, permite expandir detalhes e identifica concluídas por texto e estilo. |
| Estilizar a agenda | `frontend/src/css/pages/agenda.css`, `frontend/src/css/main.css` | Horários, cartões coloridos por tipo, controles adaptáveis e foco visível. |
| Integrar atualização das atividades | `frontend/src/js/layouts/app-layout.js` | Ao entrar na Agenda, atualiza os registros a partir da lista compartilhada e preserva a data selecionada. |

**Regras:** horários indicam prazo/início, sem atribuir duração inexistente às atividades. A linha exibe referências de 08:00 a 20:00 e inclui qualquer outro horário cadastrado, inclusive 00:00 e 23:59. Atividades simultâneas são empilhadas. Concluídas continuam visíveis e identificadas. O dia inicial corresponde à data de Fortaleza na sessão da demonstração. Cadastro de provas/projetos/eventos ainda não foi implementado; seus registros são apenas exemplos.

**Verificações executadas:** sintaxe JavaScript e git diff --check; testes do modelo para data impossível, ano bissexto, ordenação, horários extremos, atividades simultâneas, concluídas, dia vazio e preservação dos registros. No Chrome headless, foram verificados renderização dos cartões, título, dia anterior/próximo, retorno para Hoje, 29/02/2028 e bloqueio de navegação além de 1000-01-01 e 9999-12-31. Em larguras de 360 e 1280 px, a barra inferior permaneceu fixa e não houve transbordamento horizontal. Captura de celular inspecionada em `/tmp/studyup-agenda-cdp.png` (artefato temporário).

O primeiro script de inspeção selecionou uma página interna de extensão do Chrome; foi corrigido para selecionar a aba da aplicação e os testes foram repetidos com sucesso. Servidores e processos de navegador de teste foram encerrados. Os testes não cobrem aparelho físico, leitor de tela ou teclado virtual.

**Como conferir:** executar `npm start`, abrir `http://127.0.0.1:3000/views/pages/app.html#agenda`, navegar pelos dias, selecionar uma data vazia e usar Hoje. Cadastrar uma tarefa em Adicionar, retornar à Agenda e selecionar sua data; concluir/reabrir em Tarefas e retornar para conferir seu estado.

**Pendências preservadas:** Semana/Mês ainda não implementados; autenticação e persistência das telas continuam pendentes nos blocos 7.3–7.5. O próximo item visual numerado do plano é Projetos (etapa 9), cujo formulário de etapas precisa ser definido antes da construção.

### Etapa 9 — Projetos e acompanhamento de etapas (04/11/2026)

**Estado: lista, filtros e progresso em memória implementados e verificados no Chrome.**

O usuário autorizou iniciar a etapa 9. Antes da edição foi apresentada a solução de detalhes expansíveis “Ver etapas” dentro do cartão, pois os prints mostram a lista, mas não a tela de detalhes. O recorte desta entrega é acompanhamento de exemplos; formulário de criação, edição/exclusão e persistência de projetos não foram implementados.

| Tarefa realizada | Arquivos | Resultado |
| --- | --- | --- |
| Substituir painel provisório de Projetos | `frontend/views/pages/app.html` | Filtros Todos, Em andamento e Concluídos; lista, estado vazio e aviso de demonstração. |
| Criar etapas dos exemplos compartilhados | `frontend/src/js/models/demo-state.js` | Sistema Web com 3 de 5 etapas e Projeto Integrador com 2 de 5. Etapas anexadas aos próprios registros de projeto. |
| Separar cálculos e alterações de estado | `frontend/src/js/models/projetos-model.js` | Percentual derivado das etapas, filtros por conclusão, alteração de etapa e atualização de done compartilhado com as outras telas. |
| Implementar interação | `frontend/src/js/pages/projetos.js` | Cartões com prazo, disciplina, status e progress nativo; detalhes com checklist, anúncios de atualização e manutenção de foco após filtrar/remover cartões. |
| Estilizar conforme os prints | `frontend/src/css/pages/projetos.css`, `frontend/src/css/main.css` | Cartões arredondados, ícone de pasta, barra verde/amarela e duas colunas em telas maiores. |
| Integrar navegação | `frontend/src/js/layouts/app-layout.js` | Atualiza a tela Projetos ao entrar no painel; estado permanece em memória ao navegar. |

**Regras:** progresso = etapas concluídas ÷ total × 100, arredondado para exibição. Projeto sem etapas tem 0% e não é concluído. Em andamento inclui todos os não concluídos; com zero etapas feitas, o cartão mostra “Não iniciado”. Concluir todas as etapas define done=true; reabrir uma define done=false. Os resumos de Disciplinas, próximos prazos e Agenda consultam esse mesmo estado ao navegar. Recarregar restaura os exemplos. A conclusão não salva dados no MySQL.

**Verificações:** sintaxe e git diff --check; testes do modelo para 60%/40%, 100%, reabertura, 0%, projeto vazio, etapa inválida, filtros e retirada dos próximos prazos. No Chrome, foram testados os percentuais iniciais, conclusão via checkbox, filtro Concluídos, reabertura com remoção do cartão, estado vazio, recuperação de foco e retorno ao filtro Todos. Conferidas larguras de 360 e 1280 px, sem transbordamento horizontal e com navegação inferior fixa. Captura mobile inspecionada em `/tmp/studyup-projetos.png` (temporária). Houve uma falha na limpeza da pasta temporária do Chrome após os testes; a limpeza foi repetida com sucesso. Nenhuma falha da aplicação foi observada nesses testes.

**Teste manual:** executar npm start, abrir `http://127.0.0.1:3000/views/pages/app.html#projetos`, expandir Ver etapas e concluir as restantes. Conferir 100%, filtro Concluídos e reabertura ao desmarcar. Navegar à Agenda e Disciplinas para conferir o estado compartilhado. Testes não cobrem aparelho físico ou leitor de tela.

Próxima etapa visual: 10 — menu Mais e Perfil. Os blocos 7.3–7.5 de autenticação e persistência continuam pendentes.

### Etapa 10 — menu Mais e Perfil (04/11/2026)

**Estado: menu complementar e Perfil de demonstração implementados e verificados no Chrome.**

Implementação autorizada na conversa. O menu segue a referência de painel inferior sobre a tela atual. O Perfil contém apenas dados fictícios; não consulta usuários do banco nem simula sessão autenticada.

| Tarefa realizada | Arquivos | Resultado |
| --- | --- | --- |
| Criar menu e Perfil | `frontend/views/pages/app.html` | Dialog com perfil, links para telas existentes, botão de fechar e opções futuras identificadas; Perfil com avatar, nome/e-mail fictícios e informações pessoais expansíveis. |
| Adicionar acesso rápido | Mesmo HTML | Ícone de perfil no cabeçalho. Mais passa a ser botão que abre diálogo, preservando a tela ao fundo. |
| Controlar o menu | `frontend/src/js/components/menu-mais.js` | Abrir/fechar, Escape, toque fora, aria-expanded, bloqueio de rolagem ao fundo, ciclo de Tab/Shift+Tab e fechamento ao navegar. |
| Integrar a navegação | `frontend/src/js/layouts/app-layout.js` | Perfil entra no fluxo de painéis; menu fecha ao mudar de página. Endereço antigo #mais abre o menu sobre Início e normaliza o fragmento para #inicio. |
| Estilizar menu e Perfil | `frontend/src/css/components/menu-mais.css`, `frontend/src/css/pages/perfil.css`, `frontend/src/css/main.css` | Painel com fundo escurecido/desfocado, avatar amarelo, lista de opções, rolagem interna, áreas de foco e limites de largura. |

**Limites:** nome e e-mail são exemplos, não dados de Ícaro nem de uma conta real. Preferências, notificações, tema, segurança e calendário mensal aparecem como futuras; não executam ações falsas. Sair da conta está desativado e explica a dependência da autenticação. A edição de informações pessoais e upload de avatar não foram implementados.

**Verificações:** sintaxe JavaScript, referências HTML/CSS, IDs únicos, labels e git diff --check. Testes no Chrome comprovaram abertura modal, aria-expanded, foco inicial, bloqueio da rolagem de fundo, ciclo de Tab, Escape com retorno de foco, toque fora, botão Fechar, todos os destinos ativos, um único painel visível, título do Perfil, logout desativado e compatibilidade com #mais. O primeiro teste encontrou saída do foco pelo último controle; foi corrigido com ciclo explícito e o teste foi repetido com sucesso. A rotina também trata Shift+Tab, mas o teste automatizado executou apenas Tab no sentido normal.

Capturas mobile do menu e Perfil foram inspecionadas (`/tmp/studyup-menu.png` e `/tmp/studyup-perfil.png`, temporárias). Conferidas larguras de 360 e 1280 px sem transbordamento horizontal. Processos temporários de navegador e servidor foram encerrados. Não houve teste em aparelho físico ou com leitor de tela.

**Roteiro manual:** executar npm start e abrir a prévia. Em Projetos ou Agenda, acionar Mais; conferir que a tela permanece ao fundo. Navegar com Tab/Shift+Tab, fechar com Escape e tocar fora. Reabrir, acessar Disciplinas e depois Perfil. Expandir Informações pessoais e conferir a identificação de conta fictícia e os controles futuros desativados.

Próxima etapa visual: 11 — Notificações e preferências, separando visualização de demonstração, persistência e envio real. Os blocos 7.3–7.5 continuam pendentes.

### Etapa 11 — Notificações e preferências (05/11/2026)

**Estado: telas de demonstração implementadas e verificadas no Chrome. Persistência e envio real pendentes.**

Implementação autorizada na conversa. A lista apresenta exemplos agrupados em Hoje, Ontem e Anteriores, filtros por tipo, leitura individual e Ler todas. O contador de não lidas é compartilhado com o menu Mais e o Perfil. Ler todas inclui itens fora do filtro atual.

| Tarefa realizada | Arquivos | Resultado |
| --- | --- | --- |
| Separar regras e dados de demonstração | `frontend/src/js/models/notificacoes-model.js`, `frontend/src/js/models/demo-state.js` | Agrupamento, leitura, preferências padrão e validação antes de alterar o estado em memória. |
| Construir as duas telas | `frontend/views/pages/app.html` | Lista, filtros, estado vazio, formulário de preferências, mensagens de resultado e acesso pelo menu e Perfil. |
| Conectar lista e interações | `frontend/src/js/pages/notificacoes.js` | Renderização com textContent, leitura individual, leitura global e atualização dos contadores. |
| Controlar preferências | `frontend/src/js/pages/preferencias-notificacoes.js` | Opções por categoria e antecedência de 1, 2, 3 ou 7 dias, validação e salvamento temporário. |
| Integrar navegação e aparência | `frontend/src/js/layouts/app-layout.js`, `frontend/src/css/pages/notificacoes.css`, `frontend/src/css/main.css` | Rotas dos painéis, atualização ao navegar, listas, controles e foco visível. |

**Como os arquivos se comunicam:** app.html fornece a estrutura; os módulos de página escutam cliques e envio do formulário, chamam as funções do modelo e atualizam a interface. demo-state.js mantém os dados compartilhados enquanto a página está aberta. O roteador alterna os painéis. Nesta etapa, esse fluxo não faz requisições ao Express ou ao MySQL.

**Limites explícitos:** recarregar restaura exemplos e preferências padrão. Preferências salvas permanecem ao navegar entre painéis; alterações não salvas são descartadas ao sair, conforme aviso da tela. Salvar não modifica os exemplos existentes nem os lembretes individuais das tarefas. Push está desativado e não solicita permissão do navegador. Não há agendamento, e-mail, envio push ou persistência dessas informações no banco. Autenticação e APIs dos blocos 7.3–7.5 continuam pendentes.

**Verificações:** sintaxe JavaScript e git diff --check; testes do modelo para agrupamento, virada de ano, filtros, leitura e validação sem alteração parcial de preferências inválidas. No Chrome: contador inicial, leitura individual, filtro, leitura global fora do filtro, push indisponível, salvamento, conservação do estado ao navegar, descarte de edição não salva, acesso pelo menu e restauração dos padrões ao recarregar. Todos passaram. Conferidas larguras de 360 e 1280 px sem transbordamento horizontal. Capturas mobile inspecionadas em `/tmp/studyup-notificacoes.png` e `/tmp/studyup-preferencias.png` (temporárias). Servidor e navegador de teste encerrados. Não houve teste em aparelho físico ou leitor de tela.

**Roteiro manual:** executar `npm start`, acessar `/views/pages/app.html#notificacoes`, marcar uma notificação como lida, filtrar Provas e clicar Ler todas; conferir que o contador global chega a zero. Abrir Preferências, alterar opções e salvar. Sair e voltar para conferir os valores; recarregar para observar o retorno aos padrões.

**Revisão de aprendizagem:** por que salvar uma preferência na memória do navegador ainda não agenda nem envia uma notificação? Como exercício, localizar no modelo a validação que impede salvar uma antecedência não disponível.

Próxima etapa visual: 12 — revisão geral de responsividade, acessibilidade, estados vazios e erros.

### Etapa 12 — revisão geral das telas internas (05/11/2026)

**Estado: revisão da prévia concluída, com correções e verificações no Chrome.**

Implementação autorizada na conversa. O escopo desta revisão foi a aplicação interna em `app.html`, incluindo as nove telas existentes e o menu Mais. Não representa conclusão da integração com o banco ou certificação de acessibilidade.

| Problema identificado | Correção e arquivo | Motivo |
| --- | --- | --- |
| Nome de disciplina longo gerava rolagem horizontal em 320 px | `frontend/src/css/layouts/app-layout.css`: quebra de palavras herdada pelos painéis | Acomodar títulos e disciplinas nos limites permitidos pelo formulário, inclusive sem espaços. |
| Pular para o conteúdo substituía a rota por #conteudo | `frontend/src/js/layouts/app-layout.js`: interceptar o link e focar o main | Preservar a tela atual ao recarregar, sem impedir o acesso direto ao conteúdo pelo teclado. |
| Mensagem de erro era ocultada ao editar, mas outros campos podiam manter marcações antigas | `frontend/src/js/pages/adicionar.js`: centralizar clearErrors | Limpar mensagem e aria-invalid juntos, preservando a ajuda permanente do lembrete; validar novamente no próximo envio. |
| Branco sobre o verde principal tinha contraste calculado de 4,37:1 | `frontend/src/css/layouts/app-layout.css`: verde interno #187d5a | Aumentar a relação para aproximadamente 5,10:1 sem alterar a paleta da landing e autenticação. |
| Navegação fixa exige espaço ao rolar até controles | Mesmo CSS: scroll-margin nos elementos interativos | Reservar margem de rolagem para a navegação por foco. |

**Responsabilidades:** o CSS controla aparência e quebra de texto; o módulo de layout controla navegação e foco; o módulo Adicionar controla a apresentação dos erros. As regras de cadastro continuam no modelo existente, sem novas tecnologias ou funcionalidades.

**Verificações realizadas:**

- Nove painéis em 320, 360, 768 e 1280 px, verificando ausência de rolagem horizontal e um único painel visível.
- Títulos com 150 caracteres e disciplinas com 100 caracteres sem espaços nas telas Início, Tarefas, Agenda, Projetos e Disciplinas em 320 px. O teste reproduziu o transbordamento antes da correção e passou depois.
- Pesquisa sem resultados e limpeza dos filtros; estados realmente vazios de Tarefas, Disciplinas, Agenda, Projetos e Notificações, removendo apenas os dados em memória do navegador de teste.
- Erros para título e disciplina compostos por espaços; foco no título inválido, limpeza das marcações ao editar, preservação da ajuda do lembrete e retorno do foco ao cancelar o cadastro de disciplina.
- Link Pular para o conteúdo preservando #tarefas e focando o main. Menu aberto com Enter; ciclo de foco nos dois sentidos com Tab/Shift+Tab; fechamento com Escape e retorno ao botão Mais. Eventos de teclado enviados ao Chrome por CDP.
- Nenhuma exceção JavaScript capturada durante os cenários; IDs únicos e referências de labels/ARIA válidas; sintaxe dos módulos alterados e git diff --check sem erros.
- Captura do estado vazio de Disciplinas inspecionada em `/tmp/studyup-revisao-vazio.png`. Rotina temporária em `/tmp/studyup-review-cdp.mjs`; servidor e navegador temporários encerrados.

**Limites da verificação:** Chrome local, sem aparelho físico, leitor de tela, outros navegadores ou auditoria completa de contraste de todos os componentes. Não foram implementados estados de falha de API nas telas, pois elas ainda usam memória; esses estados precisam acompanhar a integração real. Os testes de backend não foram repetidos porque esta etapa não altera servidor, SQL ou conexão.

**Roteiro manual para a equipe:** executar `npm start` e abrir `/views/pages/app.html`. Reduzir a largura para 320 px; percorrer as telas; cadastrar disciplina longa e tarefa com título longo; conferir quebra de texto. Em Tarefas, pesquisar algo inexistente e limpar os filtros. Em Adicionar, tentar enviar um título com espaços e corrigi-lo. Navegar pelo teclado, abrir Mais, usar Tab/Shift+Tab e fechar com Escape. Usar Pular para o conteúdo e recarregar: a mesma tela deve permanecer. Os dados de demonstração serão restaurados ao recarregar.

**Revisão de aprendizagem:** por que ocultar a mensagem de erro não basta se o campo ainda tem aria-invalid? Exercício: localizar clearErrors e explicar a diferença entre limpar o erro visual e validar os dados.

**Próximo trabalho pendente:** retomar os blocos 7.3–7.5 de autenticação, APIs e persistência das telas, com validação no servidor e isolamento dos dados por usuário. A etapa 12 encerra a revisão desta prévia visual, não a entrega do MVP funcional completo.

### Organização dos commits locais (05/11/2026)

Divisão autorizada em 12 commits por responsabilidade, com seis mensagens identificadas por `[Ícaro]` e seis por `[Laura]`. Os nomes nas mensagens são a identificação solicitada para a organização do trabalho; a autoria configurada no Git foi preservada. Nenhum push faz parte desta tarefa.

| Ordem | Identificação | Conteúdo |
| --- | --- | --- |
| 1 | Laura | Correções da base: tipografia, SVG e links de entrada. |
| 2 | Ícaro | Express, conexão MySQL, esquema, scripts, testes e dependências. |
| 3 | Ícaro | Modelos e estado compartilhado de demonstração. |
| 4 | Ícaro | Início, lista de tarefas e formulário de cadastro. |
| 5 | Laura | Listagem e cadastro de disciplinas. |
| 6 | Laura | Agenda diária. |
| 7 | Ícaro | Projetos, filtros e checklist. |
| 8 | Laura | Menu Mais e estilos do Perfil. |
| 9 | Laura | Notificações e preferências temporárias. |
| 10 | Ícaro | HTML integrado, roteador, layout e importações de estilos. |
| 11 | Ícaro | Documentação de execução do backend e configuração do banco. |
| 12 | Laura | README atualizado e registro do plano e das entregas. |

Os módulos são adicionados antes da integração visual no commit 10. Os READMEs foram corrigidos para reconhecer as telas já implementadas e os blocos 7.1–7.2 concluídos, preservando a indicação de que autenticação e persistência das telas estão pendentes.

Verificação anterior aos commits: 13 testes do backend passaram, sintaxe de todos os módulos JavaScript conferida e git diff --check sem erros. Confirmado que `.env` permanece ignorado. `authNavigation.js` (código antigo incompleto) e `.gitkeep` vazio da raiz permanecem fora dos commits e sem alterações nesta tarefa. Este registro integra o commit 12.

### Próximas etapas propostas a partir dos prints

Cada etapa será explicada e terá suas alterações autorizadas antes da edição dos arquivos.

- [x] 2. Implementar estrutura compartilhada: cabeçalho, navegação inferior e área de conteúdo (conferência visual pendente).
- [x] 3. Início: saudação, semana, contadores e cartões com dados de demonstração (conferência visual pendente).
- [x] 4. Tarefas: lista, filtros e estados visuais com dados compartilhados em memória (conferência visual pendente).
- [x] 5. Adicionar atividade: formulário de tarefa com validação e cadastro em memória (conferência no navegador pendente).
- [x] 6. Disciplinas: lista, resumos e formulário de cadastro em memória (conferência no navegador pendente).
- [ ] 7. Integrar o núcleo com Express e MySQL: 7.1 e 7.2 concluídos e testados. Cadastro/login, APIs e persistência das telas pendentes.
- [x] 8. Agenda: visão diária com navegação por data e verificação no Chrome; Semana/Mês futuros.
- [x] 9. Projetos: lista, filtros, progresso e checklist de etapas em memória, verificados no Chrome. Cadastro e persistência pendentes.
- [x] 10. Menu Mais e Perfil: navegação complementar e perfil fictício, verificados no Chrome. Sessão e edição reais pendentes.
- [x] 11. Notificações e preferências: interface e estado em memória verificados no Chrome. Persistência e envio real pendentes.
- [x] 12. Revisão geral da prévia interna: responsividade, teclado, estados vazios e erros verificados no Chrome; limites registrados acima.

Essa sequência não representa ampliação aprovada do MVP de três dias. Escopo e comportamentos não detalhados nas referências serão discutidos durante a mentoria. Toda tarefa realizada daqui em diante deve ser registrada neste arquivo com resultado e verificação.

---

Plano baseado na leitura do PDF “PROJETO FINAL (DOCUMENTAÇÃO) (1) (1).pdf” e dos arquivos locais do projeto em 02/11/2026. É um plano proposto: não representa funcionalidades já implementadas nem aprovação do professor para reduzir requisitos.

## 1. Objetivo e premissas

Entregar uma aplicação em que um estudante cria uma conta, cadastra disciplinas, organiza tarefas com prazo e prioridade, conclui/reabre atividades e consulta suas pendências em uma interface consistente no celular e no computador. Os dados devem persistir no MySQL e cada conta deve acessar apenas seus próprios registros.

- Ícaro concentra a programação. Erica, Laura, Lucas e Iasmim produzem materiais, validam o sistema e preparam a apresentação sem precisar escrever código.
- Planejamento para três dias consecutivos, com **6 horas líquidas de programação por dia**, totalizando 18 horas. Reuniões curtas e pausas ficam fora desses blocos. Com menos disponibilidade, este cronograma precisa ser reduzido ou estendido.
- O prazo não comporta implementar todo o PDF do zero com qualidade. A redução deve ser apresentada como primeira versão, preservando no documento o que fica para evolução.
- Ambiente principal: computador de apresentação, aplicação e banco locais. Acesso por outro dispositivo na mesma rede deve ser testado antecipadamente. Publicação na internet depende da exigência real do professor.
- Como o trabalho é da disciplina de Servidores, Iasmim confirma no primeiro bloco do dia 1 se Docker, Linux/VM, publicação ou alguma configuração de servidor são obrigatórios nesta entrega. Se forem, substituem itens opcionais e exigem revisão do tempo reservado à infraestrutura; não entram silenciosamente como trabalho extra.

## 2. Diagnóstico do projeto atual

| Evidência | Situação e consequência |
| --- | --- |
| `frontend/index.html`, `views/pages/landing.html` e `auth.html` | Telas estáticas de entrada, apresentação e conta. Podem ser reaproveitadas, mas ainda não compõem uma aplicação de estudos funcional. |
| Links de CSS nas três páginas | Apontam para `assets/css/main.css`; os estilos presentes estão em `src/css/`. Corrigir antes de avaliar o visual. |
| Links de entrada/cadastro da apresentação | Usam `#entrar` e `#criar-conta`, enquanto os painéis usam `#auth-login` e `#auth-signup`. Padronizar os destinos. |
| Formulários de conta | Botões de envio desabilitados e ausência de integração com API. Login, cadastro e recuperação não estão implementados. |
| `src/js/pages/authNavigation.js` | Função incompleta, usa `name` sem parâmetro ou definição local, alterna uma classe que não controla os painéis atuais e não é importada pelo HTML. |
| `src/css/base/variables.css` | Fonte-base em `6rem`; revisar para evitar que novas telas herdem textos enormes. Há regras específicas que sobrescrevem esse tamanho em telas existentes. |
| Pasta `backend/` | Contém documentação de reserva, sem aplicação, dependências ou integração de banco implementadas. |
| README e documentos de arquitetura | Descrevem router, controllers e módulos ausentes na árvore atual. Atualizar para a implementação entregue. |
| Git | Existem alterações locais e movimentação de estilos ainda não consolidadas. Preservar esse trabalho ao iniciar a implementação. |

A análise foi feita por inspeção dos arquivos; não houve validação visual em navegador nem teste de aplicação em execução nesta etapa.

O PDF define oito tabelas e funcionalidades de contas, disciplinas, tarefas, provas, eventos, projetos, etapas, lembretes e notificações. Há também dois pontos a esclarecer: o nome aparece como StudyUp e Estudo+, e “uma conta por estudante” só pode ser aproximado por e-mail único sem um identificador escolar. Para o MVP, padronizar StudyUp e registrar explicitamente “uma conta por e-mail”.

## 3. Escopo fechado

### Obrigatório para esta proposta de MVP

1. Cadastro com nome, e-mail único e senha; entrar e sair.
2. Separação dos dados entre usuários, garantida no servidor.
3. Disciplinas: cadastrar, listar, editar e excluir. Bloquear exclusão quando houver tarefas vinculadas e explicar o motivo.
4. Tarefas: cadastrar, listar, editar e excluir, com confirmação para exclusão.
5. Campos da tarefa: título e prazo obrigatórios; disciplina e descrição opcionais; prioridade baixa, média ou alta; estado pendente ou concluída.
6. Concluir e reabrir tarefas, persistindo a alteração.
7. Listar por prazo crescente; destacar atraso e prioridade alta com texto e cor.
8. Filtrar por disciplina, status e prazo: todas, hoje, próximos sete dias e atrasadas.
9. Painel simples com contadores derivados dos dados reais e próximas tarefas. A própria lista ordenada funciona como agenda básica.
10. Persistência no banco, validação no servidor, mensagens compreensíveis e interface adaptada a celular e computador.

### Fora desta entrega, salvo exigência expressa do professor

- Projetos e suas etapas, progresso de projeto e módulos separados de provas/eventos.
- Notificações push, e-mails, agendamento automático e antecedência configurável de lembretes.
- Calendário mensal interativo, arrastar e soltar, relatórios e gráficos.
- Login com Google, recuperação de senha por e-mail, foto de perfil e “lembrar de mim” configurável.
- Aplicativo instalável, funcionamento offline, modo escuro e animações complexas.
- Docker, serviços separados na nuvem e publicação na Vercel, que o PDF posiciona como evolução posterior, sujeitos à confirmação da avaliação.

As telas iniciais devem deixar de anunciar projetos e lembretes como recursos já disponíveis. Provas e trabalhos podem ser descritos no título de uma tarefa nesta versão; isso não equivale a implementar seus módulos completos.

## 4. Decisões técnicas para poupar tempo

Manter HTML, CSS e JavaScript puro. Usar Node.js + Express e MySQL, conforme o PDF. O Express serve o frontend e a API no mesmo endereço, simplificando a execução e evitando configurar serviços separados para a apresentação.

Adotar MVC simples no backend: rotas recebem as requisições, controllers coordenam validações e respostas, models executam consultas parametrizadas. No frontend, módulos pequenos para autenticação, chamadas à API e manipulação das telas. Não reconstruir um router genérico nem migrar para um framework neste prazo.

### Dados mínimos

| Tabela | Campos essenciais |
| --- | --- |
| `usuarios` | id, nome, email único, senha_hash, criado_em |
| `disciplinas` | id, usuario_id, nome, cor opcional, criado_em |
| `tarefas` | id, usuario_id, disciplina_id opcional, titulo, descricao opcional, data_limite, prioridade, status, concluida_em opcional, criado_em, atualizado_em |

O mecanismo de sessão pode precisar de armazenamento técnico adicional. Isso não aumenta o escopo funcional das três tabelas acima.

Regras técnicas que não podem ser cortadas:

- Hash de senha com biblioteca apropriada; nunca gravar senha em texto puro.
- Sessão por cookie HttpOnly, SameSite e proteção contra requisições indevidas nas operações de escrita; cookie Secure quando houver HTTPS. Explicar no README a configuração de demonstração local.
- Credenciais em variáveis de ambiente e `.env.example` sem segredos.
- Obter `usuario_id` da sessão, nunca confiar no ID enviado pelo navegador.
- Todas as consultas de leitura, alteração e exclusão filtram por dono. Validar também se a disciplina escolhida pertence ao usuário autenticado.
- Consultas parametrizadas e conteúdo do usuário exibido como texto, sem interpretar HTML.
- Validação de título não vazio, prazo válido, e-mail, prioridade e status no servidor. Mensagens e códigos de resposta coerentes para erro de entrada, falta de sessão e recurso indisponível.
- Definir uma convenção de datas. Para a demonstração, usar explicitamente o horário de Fortaleza, converter de forma consistente e testar a virada de dia.
- “Atrasada” é uma condição calculada: pendente e prazo anterior ao momento atual. Uma tarefa concluída nunca aparece como atrasada.
- Ao concluir, preencher `concluida_em`; ao reabrir, limpar esse campo e recalcular o atraso.

### Contrato mínimo da API

| Operação | Endpoint proposto |
| --- | --- |
| Cadastrar / entrar / sair | `POST /api/auth/register`, `/login`, `/logout` |
| Consultar sessão atual | `GET /api/auth/me` |
| Listar / criar disciplinas | `GET /api/disciplinas`, `POST /api/disciplinas` |
| Editar / excluir disciplina | `PATCH /api/disciplinas/:id`, `DELETE /api/disciplinas/:id` |
| Listar / criar tarefas | `GET /api/tarefas`, `POST /api/tarefas` |
| Editar, concluir ou reabrir / excluir tarefa | `PATCH /api/tarefas/:id`, `DELETE /api/tarefas/:id` |

No volume escolar, filtros e contadores podem ser calculados no navegador sobre a lista já restrita ao usuário pela API. Isso evita endpoints extras. O servidor continua responsável pela autorização e pelas regras dos dados.

## 5. Cronograma rigoroso — programação de Ícaro

Os horários são relativos ao início de cada dia. Ao final de cada bloco, testar o resultado antes de avançar. Pausas não entram na contagem.

### Dia 1 — base corrigida, conta e primeira persistência

| Bloco | Tempo | Trabalho | Entrega verificável |
| --- | --- | --- | --- |
| 1 | 0h–0h30 | Fechar o escopo, registrar o estado atual, corrigir caminhos CSS e links de autenticação. | As três telas abrem com estilos e os links chegam ao painel correto. |
| 2 | 0h30–1h30 | Criar servidor Express, configuração de ambiente, conexão MySQL, script do esquema e comando de execução. | Servidor e banco iniciam; frontend é servido pelo Express; conexão é verificada. |
| 3 | 1h30–3h30 | Implementar cadastro, login, logout, sessão e proteção da API. Integrar os formulários existentes e retirar opções fora do escopo. | Cadastro e login reais; e-mail duplicado e senha incorreta produzem mensagens; logout encerra o acesso. |
| 4 | 3h30–4h30 | Implementar cadastro/listagem de disciplinas e tela simples de gerenciamento. | Uma disciplina criada aparece novamente após recarregar. |
| 5 | 4h30–5h30 | Criar endpoints de cadastro/listagem de tarefas e um formulário/lista inicial. | Conta → disciplina → tarefa → recarregar, com dados persistidos no MySQL. |
| 6 | 5h30–6h | Corrigir falhas do fluxo, verificar duas contas e registrar instruções mínimas de execução. | Primeira versão demonstrável; lista de pendências reais para o dia 2. |

**Portão do dia 1:** uma tarefa criada pela interface sobrevive ao recarregamento, e uma segunda conta não a vê. Se isso falhar, o primeiro bloco do dia 2 será recuperação desse fluxo; descartar qualquer melhoria opcional de aparência ou infraestrutura antes de ampliar o escopo.

### Dia 2 — regras completas e interface consistente

| Bloco | Tempo | Trabalho | Entrega verificável |
| --- | --- | --- | --- |
| 1 | 0h–1h | Completar edição/exclusão de disciplinas e a regra de vínculo. | Editar funciona; excluir disciplina em uso mostra explicação e preserva os dados. |
| 2 | 1h–2h30 | Completar edição/exclusão de tarefas, conclusão e reabertura. | Todas as operações persistem, inclusive após novo login. |
| 3 | 2h30–3h30 | Implementar filtros, ordenação, atraso e contadores do painel. | Lista e contadores correspondem aos dados de teste e aos filtros definidos. |
| 4 | 3h30–5h | Aplicar a referência visual aprovada por Erica: painel, lista, formulário e disciplinas; ajustar celular e computador. | Telas compartilham cores, tipografia, espaçamento e botões; nenhuma rolagem horizontal em 360 px. |
| 5 | 5h–6h | Tratar lista vazia, carregamento, erro, envio em andamento, navegação e sessão expirada; receber a rodada de testes da equipe. | Fluxo completo utilizável e lista de problemas classificada por gravidade. |

**Portão do dia 2:** todos os requisitos obrigatórios funcionam; o usuário consegue entrar, organizar e concluir tarefas sem orientação do programador. A partir daí, congelar funcionalidades. O dia 3 é para corrigir, comprovar e preparar a entrega.

### Dia 3 — confiabilidade e apresentação

| Bloco | Tempo | Trabalho | Entrega verificável |
| --- | --- | --- | --- |
| 1 | 0h–1h30 | Testar autorização na API, validações, persistência, datas e operações de alteração/exclusão; corrigir falhas críticas. | Tentativas de acessar registros de outra conta são recusadas e não alteram o banco. |
| 2 | 1h30–2h30 | Corrigir problemas reportados pela equipe e revisar responsividade, teclado e mensagens. | Todos os problemas que bloqueiam o roteiro estão resolvidos. |
| 3 | 2h30–3h30 | Acompanhar Iasmim iniciando o sistema pelas instruções, testar acesso pela rede e exportação/restauração do banco de demonstração. | Ambiente de apresentação validado e procedimento reproduzível. |
| 4 | 3h30–4h30 | Revisar README, diagrama e matriz de requisitos; preparar dados fictícios e revisar o roteiro. | Documentação corresponde ao produto entregue e distingue recursos futuros. |
| 5 | 4h30–5h | Ensaio com todos, cronometrado, incluindo login de uma segunda conta. | Equipe consegue demonstrar o fluxo e explicar suas responsabilidades. |
| 6 | 5h–6h | Reserva final para imprevistos; fechar pacote, backup e vídeo curto. | Versão final identificada, cópia do código, banco e evidências disponíveis. |

**Portão final:** nada que faça parte do roteiro depende de comportamento simulado. Não usar a última hora para funcionalidades novas.

## 6. Trabalho distribuído sem programação

As horas abaixo são estimativas por pessoa, independentes das 18 horas de Ícaro. Cada entrega deve ter responsável, prazo, link/arquivo e status. Não depende de contratar ferramenta: pasta compartilhada e planilha bastam.

| Pessoa | Dia 1 | Dia 2 | Dia 3 |
| --- | --- | --- | --- |
| **Erica — visual e usabilidade** | 2h: montar referência simples do painel, lista e formulário, em papel, slides ou Canva; entregar antes do bloco visual. Reaproveitar verde, dourado e branco. | 2h: comparar o produto com a referência, revisar textos, legibilidade, alinhamentos e uso no celular; registrar problemas com captura e passos. | 1h30: retestar correções, revisar capturas finais e preparar slides visuais. |
| **Laura — requisitos, testes e apresentação** | 2h: transformar o escopo em checklist e preparar o roteiro de testes; marcar cada requisito do PDF como MVP ou evolução. | 2h30: executar os testes pela interface; registrar esperado, ocorrido, gravidade e evidência; concentrar os relatos em uma lista. | 2h: retestar defeitos, fechar slides e conduzir o ensaio. |
| **Lucas — dados e validação** | 2h: desenhar o relacionamento usuário → disciplinas/tarefas, descrever os campos e montar planilha com dados fictícios. Não precisa escrever SQL. | 2h: cadastrar exemplos pelo sistema; conferir datas, prioridades, filtros, contadores e duas contas distintas. | 1h30: preparar a base limpa de demonstração, conferir o diagrama final e explicar por que cada tabela existe. |
| **Iasmim — ambiente e operação** | 2h: confirmar critérios de Servidores com o professor; levantar computador, rede, navegador e permissões; preparar checklist de instalação com orientação de Ícaro. | 2h: executar os comandos documentados, testar acesso por outro dispositivo e registrar endereço, porta e sequência de inicialização. | 2h: testar reinício, acompanhar backup/restauração guiados, conferir equipamento, apresentação e vídeo de reserva. |
| **Ícaro — desenvolvimento e integração** | Executar os seis blocos do dia 1 e revisar rapidamente o modelo de dados. | Executar os blocos do dia 2 e incorporar os materiais da equipe. | Corrigir, validar tecnicamente, fechar versão e acompanhar o ensaio. |

Executar comandos documentados ou operar uma interface de banco não exige escrever código, mas pode exigir ajuda inicial. Ícaro fornece os scripts de criação e backup; Iasmim executa e documenta; Lucas valida o conteúdo. Credenciais não devem entrar nos slides ou nas capturas.

### Pacotes que podem ser repassados diretamente

**Erica:** “Entregue uma referência de painel, tarefas e formulário usando as cores atuais. Defina títulos, botões, aparência dos cartões e mensagens de tela vazia. Depois teste em um celular e envie problemas com captura e explicação.”

**Laura:** “Monte uma planilha de testes com cenário, passos, resultado esperado, resultado encontrado e status. Confira o que o PDF pede e o que foi entregue. Prepare slides de problema, solução, escopo, arquitetura, demonstração e próximos passos.”

**Lucas:** “Desenhe as três tabelas e seus relacionamentos. Prepare dois usuários fictícios, três disciplinas para o principal e oito tarefas com prioridades, datas e estados variados. Confira se a lista e os contadores correspondem aos exemplos.”

**Iasmim:** “Confirme os critérios de infraestrutura da avaliação. Prepare a máquina e a rede da apresentação, siga o README para iniciar tudo, teste em outro aparelho e registre o procedimento. Cuide do backup e do material de reserva.”

Todos devem entender o fluxo navegador → servidor → banco e conseguir explicar pelo menos uma decisão ou teste do projeto. O PDF prevê participação de todos; alinhar com o professor se a distribuição proposta, concentrando código em Ícaro, atende à avaliação individual.

## 7. Critério visual de aceite

- Manter verde `#1b8963`, dourado `#e6ad13` e superfícies claras já existentes; usar dourado em detalhes.
- Fonte-base próxima de 16 px; fonte alternativa local/do sistema para a apresentação não depender de Google Fonts.
- Navegação curta: Início, Tarefas, Disciplinas e Sair. “Nova tarefa” deve estar evidente.
- Painel com resumo de pendentes, atrasadas e concluídas; abaixo, próximas tarefas. Evitar gráficos decorativos.
- Cartão de tarefa com título, disciplina, prazo, prioridade e ação de conclusão, com hierarquia clara.
- Formulário em coluna no celular; largura confortável e centralizada no computador.
- Bordas suaves, espaçamento consistente e um único estilo de botão principal.
- Estados de carregamento, vazio, erro e sucesso. Não deixar controles aparentemente funcionais sem implementação.
- Prioridade e atraso identificados por texto além de cor; foco de teclado visível, rótulos nos campos e contraste legível.
- Verificar largura de 360 px, celular real e computador; teclado virtual não deve esconder definitivamente o botão de salvar.

## 8. Matriz mínima de testes

Laura coordena os testes pela interface. Ícaro verifica os casos de API e banco que não podem ser comprovados apenas clicando nas telas.

| Teste | Resultado esperado | Responsável |
| --- | --- | --- |
| Cadastrar e entrar | Conta criada e acesso liberado; senha não aparece em texto puro no banco. | Laura + Ícaro |
| E-mail duplicado / senha incorreta | Mensagens compreensíveis; nenhuma conta duplicada nem acesso indevido. | Laura |
| Sair / consultar API sem sessão | Sessão encerrada e endpoints protegidos recusam acesso. | Ícaro |
| Duas contas | Cada uma vê apenas seus dados. | Lucas |
| Alterar IDs em requisições | Conta B não lê, edita, conclui ou exclui dados da conta A, nem usa sua disciplina. | Ícaro |
| Criar tarefa sem título ou prazo | Interface orienta; servidor também rejeita a entrada inválida. | Laura + Ícaro |
| Criar, editar e excluir tarefa | Lista e banco refletem a operação; cancelamento da confirmação preserva a tarefa. | Laura |
| Concluir e reabrir | Estado persiste; tarefa concluída não aparece atrasada; reaberta volta às regras normais. | Lucas |
| Filtros e contadores | Correspondem aos exemplos e à regra de contagem documentada. | Lucas |
| Prazo passado, futuro, hoje e virada de dia | Classificação coerente com o horário de Fortaleza; testar limites sem modificar o relógio da máquina. | Lucas + Ícaro |
| Excluir disciplina vinculada | Exclusão bloqueada com explicação; tarefas preservadas. | Laura |
| Recarregar / novo login / reiniciar servidor | Dados persistem; se a sessão terminar após reinício, novo login recupera os dados normalmente. | Iasmim |
| Rede/API indisponível | Mensagem de falha; formulário preserva entrada e não informa sucesso falso. | Ícaro + Laura |
| Celular, teclado e lista vazia | Interface utilizável, sem conteúdo cortado e com orientação para começar. | Erica |
| Instalação e restauração guiadas | Aplicação inicia seguindo o README; cópia de teste restaura os dados fictícios. | Iasmim + Ícaro |

Priorizar testes automatizados pequenos para isolamento entre usuários e regras de prazo/status, além da verificação manual ponta a ponta. Não gastar o prazo criando testes que apenas repetem detalhes de CSS.

## 9. Controle de prazo e mudanças

- Abertura diária: 10 minutos para alinhar objetivo, responsáveis e bloqueios. Encerramento: 15 minutos para demonstrar o que está funcionando.
- Quadro com A fazer / Em andamento / Em teste / Concluído. “Concluído” exige evidência de funcionamento e reteste quando houver correção.
- Problema crítico: vazamento de dados, perda de dados, falha de login ou impossibilidade de salvar. Corrigir antes de qualquer acabamento.
- Problema importante: filtro errado, ação obrigatória falhando ou interface inutilizável no celular. Resolver antes da entrega.
- Problema cosmético: pequeno desalinhamento sem impedir uso. Resolver apenas depois dos anteriores.
- Nenhuma funcionalidade nova após o dia 2. Pedidos novos vão para a lista de evolução.
- Se houver atraso, cortar primeiro polimento da apresentação inicial, animações e tentativas de publicação opcional. Preservar persistência, autorização e fluxo de tarefas.
- Se nem o núcleo couber, registrar o que ficou pendente e renegociar a entrega. Não apresentar armazenamento local como se fosse integração com servidor/MySQL.

## 10. Demonstração e pacote final

Roteiro sugerido de 5–7 minutos, ajustável ao tempo determinado pelo professor:

1. Laura apresenta o problema e o recorte do MVP (40 s).
2. Erica apresenta a interface e a preocupação com uso no celular (30 s).
3. Ícaro entra, cria disciplina/tarefa, edita, filtra, conclui/reabre e recarrega a página (2–3 min).
4. Lucas mostra a segunda conta sem os dados da primeira e explica as três tabelas (1 min).
5. Iasmim explica onde rodam servidor e banco e como iniciar o ambiente (1 min).
6. Laura encerra mostrando o que foi entregue e o que ficou para uma próxima versão (30 s).

Usar apenas dados fictícios e exemplos de prazo relativos ao dia da apresentação. Deixar uma segunda conta preparada e testar todo o roteiro antes da aula.

Checklist de entrega:

- [ ] Aplicação funcional com o escopo obrigatório aprovado e testado.
- [ ] Código com identificação clara da versão final e sem credenciais.
- [ ] README com requisitos, configuração, criação do banco, execução e solução de problemas comuns.
- [ ] `.env.example`, script de criação do banco e instruções para carregar dados fictícios.
- [ ] Diagrama de três tabelas e desenho navegador → Express → MySQL.
- [ ] Matriz do PDF com implementado / simplificado / futuro, sem promessas contraditórias nas telas.
- [ ] Planilha de testes preenchida e problemas críticos encerrados.
- [ ] Slides, capturas e vídeo curto do fluxo como evidência e apoio em caso de falha do equipamento.
- [ ] Cópia do código e exportação do banco de demonstração, com restauração verificada em ambiente de teste.

O vídeo apoia a apresentação; o principal resultado continua sendo o sistema funcionando ao vivo. A aprovação escolar depende dos critérios do professor, especialmente das exigências de infraestrutura e participação individual.
