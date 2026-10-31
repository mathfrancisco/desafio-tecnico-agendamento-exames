# 01 — Tecnologias

Escolhas guiadas por KISS e YAGNI: o mínimo que resolve o desafio com segurança e é fácil de rodar.

## Arranjo do repositório

Monorepo com duas pastas independentes:

```
backend/    API REST (NestJS)
frontend/   SPA (React + Vite)
dados/      arquivos fornecidos pelo desafio (lidos pelo back-end)
docs/       documentação de projeto
```

Motivo: um único clone, histórico único mostrando a evolução das duas pontas e
o contrato da API versionado junto com quem o consome. Cada pasta tem o seu
próprio `package.json`; não há ferramenta de workspace (não é necessária).

## Back-end

| Tecnologia | Versão | Por quê |
| --- | --- | --- |
| Node.js | 20+ (testado em 24) | Requisito do desafio; NestJS 11 exige 20+ |
| TypeScript | 5.x | Tipagem do domínio |
| NestJS | 11.x | Stack preferida; módulos e injeção de dependência ajudam a separar responsabilidades |
| better-sqlite3 | 12.x | SQLite embutido, sem servidor; API síncrona; um trigger no banco barra intervalos sobrepostos, então dois pedidos simultâneos não geram agendamento duplicado |
| class-validator / class-transformer | latest | Validação declarativa dos DTOs via `ValidationPipe` |
| Jest + Supertest | padrão Nest | Testes unitários e e2e |
| @nestjs/swagger | 11.x | Contrato navegável em `/api/docs`, gerado do próprio código |
| GitHub Actions | — | CI com lint, build e testes das duas pontas |

Por que SQLite e não Postgres/Mongo: zero instalação para quem avalia (o banco é
um arquivo criado na primeira execução) e escrita serializada suficiente para
a regra de concorrência. Por que não só memória: agendamentos sobrevivem a
reinícios e o controle de concorrência fica no banco, não em código ad hoc.

Os catálogos (exames e médicos) são dados de referência fixos fornecidos pelo
desafio. Ficam em memória: exames lidos de `dados/exames.csv` na subida;
médicos declarados em código a partir de `dados/medicos.md` (o arquivo é texto
livre, não vale escrever um parser para ele).

## Front-end

| Tecnologia | Versão | Por quê |
| --- | --- | --- |
| React | 19.x | Requisito do desafio |
| TypeScript | 5.x | Tipos compartilham o vocabulário do contrato da API |
| Vite | 7.x | Dev server rápido, build simples, proxy embutido para a API; sem SSR, que não é necessário aqui |
| CSS puro | — | Uma folha de estilo; sem design system (pedido do desafio) |
| Vitest + Testing Library | latest | Mesmo pipeline do Vite; testes de componentes |

Estado: `useState`/`useEffect` locais. Não há estado global que justifique
Redux/Zustand/React Query.

## Portas

- API: `http://localhost:3000`, prefixo `/api`.
- Front: `http://localhost:5173`; o Vite faz proxy de `/api` para a porta 3000,
  então não há CORS para configurar.
