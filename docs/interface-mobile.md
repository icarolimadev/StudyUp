# Interface mobile

## Base implementada

- Viewport com largura do dispositivo, sem impedir zoom.
- Layout em uma coluna e largura máxima para telas grandes.
- Unidades `dvh`, com fallback em `vh`.
- Espaço para áreas seguras nos aparelhos que as expõem.
- Navegação inferior fixa, com reserva de espaço no conteúdo.
- Alvos de toque com dimensão mínima de 3rem nos controles base.
- Campos com fonte de 1rem e largura fluida.
- Foco visível, link para pular ao conteúdo e indicação de página atual.
- Preferência por movimento reduzido respeitada.

## Ao desenvolver telas

Teste larguras de 320, 375 e 430 pixels, orientação horizontal e uma tela maior. Verifique zoom, textos longos e ausência de rolagem horizontal.

Em formulários, use `type`, `inputmode` e `autocomplete` apropriados. Associe instruções e mensagens de erro aos campos. Teste com teclado virtual aberto para garantir que campos e ações permaneçam alcançáveis; a base CSS não substitui esse teste em dispositivo real.

Ao acrescentar itens à navegação, confira sua altura e a reserva de espaço do conteúdo. Não dependa de hover ou apenas de cores para comunicar estado.

Imagens futuras devem ter dimensões declaradas e formatos/tamanhos adequados ao dispositivo. Fontes de sistema evitam downloads nesta etapa.

PWA, offline e notificações não fazem parte desta estrutura inicial.
