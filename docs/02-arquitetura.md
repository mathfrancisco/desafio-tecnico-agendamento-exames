# 02 — Arquitetura

## Visão geral

```
[ React SPA ] --HTTP/JSON--> [ NestJS API ] --> [ SQLite: agendamentos ]
                                   |
                                   +--> catálogo em memória (exames.csv, médicos)
```

## Back-end

Um módulo Nest por assunto. Cada módulo segue a mesma divisão simples:

- **controller**: HTTP apenas (rota, DTO, status). Sem regra de negócio.
- **service**: casos de uso e regras.
- **repository**: acesso a dados (CSV, constante em código ou SQLite).
- **funções puras de domínio**: o núcleo da regra (geração de horários) não
  depende de Nest, banco nem relógio, e é testado isoladamente.

```
backend/src/
  main.ts                      bootstrap, prefixo /api, ValidationPipe, filtro de erros
  app.module.ts
  config.ts                    PORT, DB_PATH, EXAMES_CSV_PATH, fuso da clínica
  shared/
    clock.ts                   token CLOCK + SystemClock (hora local America/Sao_Paulo)
    tempo.ts                   conversões HH:MM <-> minutos, dia da semana de uma data
    erros.ts                   NaoEncontradoError, RegraNegocioError, ConflitoError
    erros.filter.ts            traduz erros de domínio em 404 / 422 / 409
  database/
    database.module.ts         provê a conexão better-sqlite3 e cria o schema
  exames/
    exames.repository.ts       lê o CSV uma vez
    exames.service.ts          buscar por nome, obter por id
    exames.controller.ts       GET /api/exames
  medicos/
    medicos.data.ts            os 5 médicos e seus turnos
    medicos.repository.ts
    medicos.service.ts
    medicos.controller.ts      GET /api/medicos
  agendamentos/
    gerar-horarios.ts          função pura: turnos + duração + ocupados -> horários livres
    agenda.service.ts          horários livres de um médico/exame/data
    agenda.controller.ts       GET /api/medicos/:medicoId/horarios
    agendamentos.repository.ts SQLite; inserção atômica com checagem de sobreposição
    agendamentos.service.ts    criar agendamento aplicando as regras
    agendamentos.controller.ts POST /api/agendamentos
    dto/
```

`agenda` e `agendamentos` ficam no mesmo módulo porque um depende do outro:
a agenda precisa dos agendamentos ocupados, e criar um agendamento exige que o
horário esteja na agenda. Separar geraria dependência circular sem ganho.

### Como os princípios aparecem

- **SRP**: controller só fala HTTP; service só regra; repository só dados.
- **DIP**: o relógio é injetado pelo token `CLOCK`. Testes usam um relógio fixo
  e as regras "sem passado" ficam determinísticas.
- **OCP**: novas fontes de dados trocam o repository sem tocar o service.
- **KISS/YAGNI**: sem CQRS, sem camadas de "use case" extras, sem ORM, sem
  autenticação, sem cancelamento. Interfaces só onde há dois implementadores
  reais (o relógio).

### Erros

O domínio lança erros próprios; um filtro global traduz para HTTP:

| Erro | HTTP | Quando |
| --- | --- | --- |
| validação de DTO (`ValidationPipe`) | 400 | campo ausente, formato inválido |
| `NaoEncontradoError` | 404 | exame ou médico inexistente |
| `RegraNegocioError` | 422 | horário no passado, fora do expediente, fora da grade |
| `ConflitoError` | 409 | horário já ocupado (inclusive por pedido concorrente) |

Corpo: `{ "statusCode": 409, "error": "Conflict", "message": "..." }`
(mesmo formato padrão do Nest).

### Concorrência

A inserção roda dentro de `db.transaction(...).immediate()`:

1. `BEGIN IMMEDIATE` obtém o lock de escrita do SQLite.
2. `SELECT` procura agendamento do mesmo médico cujo intervalo cruze o novo.
3. Se existir, lança `ConflitoError`; senão, `INSERT`.

O better-sqlite3 é síncrono, então dentro do processo não há `await` entre a
checagem e a inserção; entre processos o lock `IMMEDIATE` serializa as escritas.
Resultado: de N pedidos simultâneos para o mesmo horário, exatamente um vence e
os demais recebem 409. Há teste e2e para isso.

## Front-end

Uma página com fluxo em etapas, sem roteador (YAGNI):

```
frontend/src/
  main.tsx
  App.tsx                     orquestra as etapas e guarda as seleções
  api/
    client.ts                 fetch + ApiError(status, message)
    types.ts                  tipos do contrato da API
  components/
    ExameBusca.tsx            input com debounce + resultados
    MedicoData.tsx            escolha de médico e data
    HorariosLista.tsx         horários livres (carregando/vazio/erro)
    AgendamentoForm.tsx       nome do paciente + confirmar
    Confirmacao.tsx           resumo do agendamento criado
  styles.css
```

Estados tratados em toda chamada: carregando, vazio, erro (com mensagem da
API) e sucesso. Em 409 o front avisa que o horário acabou de ser ocupado e
recarrega a lista de horários.
