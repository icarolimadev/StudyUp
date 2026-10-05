# Desenvolvimento

## Executar localmente

Requisito para o comando abaixo: Python 3. Não há dependências npm nesta etapa.

```sh
python3 -m http.server 8000 --directory frontend
```

Abra http://localhost:8000. O endereço inicial será `#/inicio`. O servidor serve somente `frontend`. Módulos e templates precisam de HTTP; não abra por `file://`.

Para testar em um celular na mesma rede, use `http://IP-LOCAL-DO-COMPUTADOR:8000`, caso o firewall permita. Use esse servidor apenas para desenvolvimento em rede confiável.

## Adicionar uma página

1. Crie `views/pages/minha-pagina.html` como fragmento HTML, sem repetir `html`, `head` ou `body`.
2. Crie `css/pages/minha-pagina.css` e importe em `css/main.css`.
3. Crie `js/pages/minha-pagina.js`, usando `inicio.js` como referência.
4. Adicione um controller quando houver coordenação de ações/dados e models conforme o domínio.
5. Registre a função de preparação em `js/routes/routes.js` e a constante de rota em `js/base/constants.js`.
6. Acrescente links com `href="#/minha-pagina"`; na navegação inferior, use também `data-route="/minha-pagina"`.
7. Use `mount(container)` para registrar eventos e retorne a função de limpeza.

## Adicionar um componente

Crie seu HTML em `views/components`, o CSS em `css/components` e o comportamento em `js/components`, quando necessário. Importe seu CSS em `main.css` e monte o componente a partir da página ou layout. Um botão simples pode usar apenas a classe `.button`, sem template ou JS próprios.

## Verificar mudanças

- Abra a tela inicial e uma rota inexistente, como `#/teste`.
- Confira voltar/avançar do navegador e links da navegação.
- Navegue pelo teclado e confira o link de pular para o conteúdo.
- Confira o console e a aba de rede: não deve haver erros de módulos/templates.
- Teste em celular e com teclado virtual ao adicionar formulários.
- Para regras de negócio e integrações futuras, acrescente testes adequados às ferramentas escolhidas.

Os templates são armazenados em memória durante a sessão; recarregue a página após editar um template.
