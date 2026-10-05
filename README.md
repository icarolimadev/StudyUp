    # StudyUp

Base de uma aplicação de estudos com foco em celular, construída com HTML, CSS e JavaScript puro em módulos.

## Executar

Na raiz do projeto:

```sh
python3 -m http.server 8000 --directory frontend
```

Abra http://localhost:8000. Use um servidor HTTP; abrir o HTML por `file://` não permite carregar os módulos e templates corretamente.

## Organização

- `frontend/`: interface, controllers e models do navegador.
- `backend/`: espaço reservado para o futuro servidor.
- `docs/`: documentação inicial. Comece pelo [índice](docs/README.md).

A base contém uma tela inicial, navegação por hash e tela de rota desconhecida. Funcionalidades de estudo e integração com API ainda serão definidas.
