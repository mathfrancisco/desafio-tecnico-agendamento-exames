# 06 — Deploy (Docker + Northflank)

## Imagem

Um único container (`Dockerfile` na raiz, multi-stage):

1. `frontend`: `npm ci` + `vite build`.
2. `backend`: `npm ci` + `nest build` + `npm prune --omit=dev`.
3. Final (`node:24-bookworm-slim`): API compilada, build do front em
   `/app/public` e `dados/`.

Em produção a API serve o front no mesmo domínio (`FRONTEND_DIST`): rotas
`/api/*` vão para o Nest; o resto devolve arquivos estáticos ou `index.html`
(SPA). Um serviço, uma URL, sem CORS.

| Variável | Valor na imagem |
| --- | --- |
| `PORT` | `3000` |
| `DB_PATH` | `/data/agendamentos.db` (volume) |
| `EXAMES_CSV_PATH` | `/app/dados/exames.csv` |
| `FRONTEND_DIST` | `/app/public` |

### Rodar a imagem localmente

```bash
docker build -t agenda-imagem .
```

```bash
docker run --rm -p 3000:3000 -v agenda-dados:/data agenda-imagem
```

Abra `http://localhost:3000`. Swagger em `/api/docs`, health em `/api/health`.

## Northflank

No ar em https://p01--agenda-imagem--4cj5fhqhqb2r.code.run (serviço
`agenda-imagem`, projeto `Default`, plano gratuito, US - Central).

Estado atual do deploy:

- Repositório ligado como **repo público**, sem a GitHub App do Northflank:
  novos commits não disparam build sozinhos. Para atualizar, use *Start build*
  no serviço, ou dê à GitHub App acesso a este repositório.
- **Sem volume**: volumes são cobrados à parte. Sem `/data` persistente, o
  SQLite vive no disco do container e é zerado a cada deploy.
- Readiness probe HTTP em `/api/health`, porta `3000`.

Passo a passo para recriar (serviço combinado a partir do repositório GitHub):

1. **Projeto**: crie um projeto (qualquer região).
2. **Serviço**: *Create new → Service → Combined service*.
   - Repositório `mathfrancisco/desafio-tecnico-agendamento-exames`, branch `main`.
   - Build type **Dockerfile**, arquivo `/Dockerfile`, contexto `/`.
   - Porta `3000`, protocolo HTTP, **public** ligado.
   - Plano: o menor disponível basta.
3. **Volume**: no serviço, *Volumes → Add volume*, 1 GB, mount path `/data`.
   Sem volume o SQLite funciona, mas os agendamentos somem a cada deploy.
4. **Health check**: *Health checks → Add*, tipo HTTP, porta `3000`,
   caminho `/api/health`, como readiness e liveness.
5. Cada push na `main` gera build e deploy automáticos. A URL pública aparece
   em *Ports & DNS* (`https://<porta>--<serviço>--<projeto>.code.run`).

Limitação conhecida: com SQLite em volume o serviço roda com **1 instância**.
Escalar horizontalmente exige trocar o adapter de agendamentos por Postgres
(port já existe em `application/ports`).
