# 02 — Arquitetura

## Visão geral

```
[ React SPA ] --HTTP/JSON--> [ NestJS API ] --> [ SQLite: agendamentos ]
                                   |
                                   +--> catálogo em memória (exames.csv, médicos)
```

## Back-end: Clean Architecture

Quatro camadas. A regra de dependência aponta sempre para dentro:
`http -> application -> domain` e `infrastructure -> application -> domain`.

```
         +-------------------------------------------+
         | http (Nest: controllers, DTOs, filtro)    |
         |   +-----------------------------------+   |
         |   | application (use cases + ports)   |   |
         |   |   +---------------------------+   |   |
         |   |   | domain (entidades, regras)|   |   |
         |   |   +---------------------------+   |   |
         |   +-----------------------------------+   |
         | infrastructure (SQLite, CSV, relógio)     |
         +-------------------------------------------+
```

| Camada | Pode importar | Não pode importar |
| --- | --- | --- |
| `domain` | nada além de TypeScript | Nest, better-sqlite3, outras camadas |
| `application` | `domain` | Nest, better-sqlite3, `infrastructure`, `http` |
| `infrastructure` | `application` (ports), `domain`, libs de I/O | `http` |
| `http` | `application`, `domain`, Nest | `infrastructure` (só o módulo de composição liga as peças) |

A regra é verificada pelo ESLint (`no-restricted-imports` em `domain/` e
`application/`): violar a arquitetura quebra o lint e a CI.

```
backend/src/
  main.ts                         bootstrap
  app.module.ts                   composição: liga ports a adapters e use cases a controllers
  config.ts                       PORT, DB_PATH, EXAMES_CSV_PATH, fuso da clínica
  domain/
    exame.ts                      tipo Exame
    medico.ts                     Medico, Turno, DiaSemana, turnosDoDia(medico, data)
    agendamento.ts                Agendamento; fim derivado de inicio + duração
    gerar-horarios.ts             núcleo puro da RN2
    tempo.ts                      HH:MM <-> minutos, dia da semana, dias do mês
    erros.ts                      NaoEncontradoError, RegraNegocioError, ConflitoError
  application/
    ports/
      exames.repository.ts        interface + token
      medicos.repository.ts
      agendamentos.repository.ts  inserirSeLivre, listarPorPeriodo, obter, remover
      clock.ts                    agoraLocal()
    use-cases/
      buscar-exames.ts
      listar-medicos.ts
      consultar-horarios.ts       horários livres de um dia
      consultar-disponibilidade.ts total de horários livres por dia do mês
      criar-agendamento.ts
      listar-agendamentos.ts
      cancelar-agendamento.ts
  infrastructure/
    csv/exames-csv.repository.ts
    memoria/medicos.data.ts, medicos-memoria.repository.ts
    sqlite/database.ts, agendamentos-sqlite.repository.ts
    clock/system-clock.ts
  http/
    app.setup.ts                  prefixo /api, ValidationPipe, filtro de erros, Swagger
    erros.filter.ts               erro de domínio -> 404 / 422 / 409
    parse-id.pipe.ts              id de rota inteiro, com 400 em português
    servir-frontend.ts            em produção, serve o build do front (SPA)
    controllers/                  exames, medicos, agendamentos, health
    dto/                          DTOs validados e documentados no Swagger
```

Use cases são classes TypeScript puras, uma por caso de uso, com um método
`executar(...)`. Recebem ports pelo construtor. O `app.module.ts` é o único
lugar que conhece as implementações concretas e registra os use cases com
`useFactory`. Assim o núcleo é testado sem Nest e sem banco (ports falsos em
memória), e trocar SQLite por Postgres seria um novo adapter, sem tocar regra.

### Como os princípios aparecem

- **SRP**: um use case por arquivo; controller só traduz HTTP; adapter só I/O.
- **OCP/DIP**: regras dependem de ports (interfaces), nunca de SQLite, CSV ou
  do relógio do sistema.
- **ISP**: cada port expõe só o que os use cases usam.
- **KISS/YAGNI**: sem CQRS, sem event bus, sem ORM, sem autenticação. Uma
  interface só existe quando há fronteira de I/O.

### Erros

O domínio e os use cases lançam erros próprios; um filtro global traduz para HTTP:

| Erro | HTTP | Quando |
| --- | --- | --- |
| validação de DTO (`ValidationPipe`) | 400 | campo ausente, formato inválido |
| `NaoEncontradoError` | 404 | exame, médico ou agendamento inexistente |
| `RegraNegocioError` | 422 | passado, fora do expediente/grade, cancelar agendamento já iniciado |
| `ConflitoError` | 409 | horário já ocupado (inclusive por pedido concorrente) |

Corpo: `{ "statusCode": 409, "error": "Conflict", "message": "..." }`.

### Concorrência

A RN3 é uma regra do próprio banco: o trigger `agendamentos_sem_sobreposicao`
(`BEFORE INSERT`) procura um agendamento do mesmo médico cujo intervalo cruze o
novo e, se achar, aborta o `INSERT` com `RAISE(ABORT)`. O repositório só faz o
`INSERT` e traduz esse erro (`SQLITE_CONSTRAINT_TRIGGER`) em `ConflitoError`.

- Checagem e escrita são um único comando SQL. O SQLite toma o lock de escrita
  no início do comando e só uma escrita roda por vez no arquivo, então não há
  janela entre "checar" e "inserir", nem entre processos.
- Vale para qualquer escrita, não só para a API: um `INSERT` manual ou um
  segundo processo apontando para o mesmo arquivo também é barrado.
- `journal_mode = WAL`: leituras (`/horarios`, `/disponibilidade`) não esperam
  por uma escrita em curso. Escritas concorrentes esperam o lock até 5 s
  (`timeout` padrão do better-sqlite3) em vez de falhar na hora.

Testes: e2e com 10 POSTs simultâneos ao mesmo horário (exatamente um 201 e nove
409) e teste do repositório com duas conexões ao mesmo arquivo, simulando dois
processos.

### Operação

- `GET /api/health`: verifica o banco (`SELECT 1`); usado pelo health check do deploy.
- `GET /api/docs`: documentação OpenAPI (Swagger) gerada dos controllers e DTOs.
- GitHub Actions (`.github/workflows/ci.yml`): lint, build e testes das duas pontas em cada push e PR.

## Front-end

Layout inspirado num painel de agenda: topbar, sidebar e calendário mensal.
Duas telas trocadas por estado (sem roteador, YAGNI):

- **Agendar exame**: busca de exame na topbar; escolha do médico em chips;
  navegação de mês (Hoje, <, mês, >). O calendário mostra, por dia, quantos
  horários livres há e os exames já marcados daquele médico. Dias sem
  expediente ou passados ficam apagados. Clicar num dia abre um painel lateral
  com os horários livres, o nome do paciente e o botão **Agendar**. O nome
  fica guardado na tela (não no painel): depois de um 409 o usuário escolhe
  outro dia ou médico sem redigitar; ele é limpo após um agendamento criado.
- **Agendamentos**: calendário do mês com todos os exames marcados (filtro por
  médico). Clicar num exame abre o painel com detalhes e **Cancelar**.

Regras do front que acompanham as do back:

- "Hoje" é a data no fuso da clínica (PR1), não a do navegador, e `useHoje`
  confere a cada minuto: se o dia virar com a tela aberta, o calendário se
  atualiza, as contagens do mês são buscadas de novo e o painel de um dia que
  ficou no passado fecha.
- Agendar: 409 (horário tomado) e 422 (horário passou com a tela aberta)
  recarregam os horários do dia e as contagens do mês e pedem outra escolha.
- Cancelar: 404 significa que outra pessoa já cancelou; o painel fecha e o mês
  é recarregado, como num cancelamento bem-sucedido.

```
frontend/src/
  main.tsx
  App.tsx                     layout (topbar + sidebar) e tela ativa
  api/                        client.ts (fetch + ApiError), types.ts
  hooks/                      useDebounce, useRequisicao, useHoje
  utils/                      datas (mês, grade do calendário), cores por modalidade
  components/
    layout/                   Topbar, Sidebar
    calendario/               Calendario, DiaCelula, EventoCard, NavegacaoMes
    agendar/                  AgendarPagina, BuscaExame, SeletorMedico, PainelDia
    agendamentos/             AgendamentosPagina, PainelAgendamento
  styles.css                  tokens de cor/espaço e componentes
```

Estados tratados em toda chamada: carregando, vazio, erro (mensagem da API) e
sucesso. Em 409 o painel avisa que o horário acabou de ser ocupado e recarrega
dia e mês. Em telas estreitas o calendário vira lista de dias.
