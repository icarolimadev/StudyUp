# Arquitetura

O frontend usa uma organização MVC adaptada ao navegador.

| Camada | Responsabilidade |
| --- | --- |
| Models | Dados e regras de negócio, sem acesso ao DOM. |
| Views HTML | Estrutura visual das páginas e componentes. |
| JS de páginas | Preparação da apresentação, eventos e atualização do DOM. |
| Controllers | Coordenação de ações, models e services. |
| Services | Carregamento de templates, armazenamento e futuras integrações. |

Fluxo de uma interação: evento na página → controller → model/service → atualização da apresentação pela página.

`app.js` monta o layout, cabeçalho e navegação. O router escolhe a página a partir do hash. Cada função de preparação retorna `title`, `html` e, opcionalmente, `mount(container)`. A função `mount` pode retornar uma função de limpeza de eventos, timers e outros recursos. O router a executa ao sair da página.

A preparação de uma página não deve alterar o DOM: o router descarta respostas de navegações antigas. Templates são carregados por HTTP e mantidos em cache na sessão. Apenas templates locais controlados pelo projeto podem ser inseridos como HTML; dados de usuários devem ser exibidos com `textContent`.

`inicio-controller.js` demonstra o ponto de entrada para coordenação; nenhum model de domínio foi inventado antes da definição das funcionalidades.

O backend está reservado e não participa da execução atual.
