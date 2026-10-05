# Convenções

- Arquivos e pastas em minúsculas, sem acentos e com hífens entre palavras.
- Mesmo nome para HTML, CSS e JS de uma página ou componente.
- JavaScript com `import`/`export`, extensões `.js` explícitas, `const` por padrão e sem variáveis globais compartilhadas.
- `config.js` guarda configurações públicas; `constants.js` guarda constantes. Não colocar segredos no frontend.
- CSS reutiliza tokens de `variables.css`. Classes de componentes usam prefixos próprios, como `header__brand`.
- Estilos base atendem telas pequenas; media queries ampliam o layout quando necessário.
- HTML semântico, labels associados a campos e botões reais para ações.
- JS de página não concentra regras de negócio ou chamadas de API: delegue aos controllers e services.
- Eventos e timers de páginas devem ser removidos pela função de limpeza retornada por `mount`.
- Conteúdo dinâmico de usuários é inserido com `textContent`, não com `innerHTML`.
- O service de storage retorna fallback/false em caso de indisponibilidade; o chamador deve tratar falhas de gravação. Não é persistência garantida nem armazenamento para segredos.

Breakpoints usam valores explícitos nas media queries; variáveis CSS comuns não podem ser usadas diretamente nas condições dessas queries.
