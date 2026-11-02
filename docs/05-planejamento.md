# 05 — Planejamento: specs e cards

Cada **spec** descreve uma capacidade de ponta a ponta. Cada spec se quebra em
**cards** pequenos, entregáveis num commit, com critério de aceite verificável.
Prefixos: `BE` back-end, `FE` front-end, `DOC` documentação.

Ordem de execução: SPEC-00 → SPEC-01 → SPEC-02 → SPEC-03 → SPEC-04. Back e
front de uma mesma spec podem andar em paralelo porque o contrato está fixado
em [03-modelagem-dados.md](./03-modelagem-dados.md).

---

## SPEC-00 — Fundação

**Objetivo:** repositório, documentação e esqueletos rodando.

| Card | Descrição | Aceite |
| --- | --- | --- |
| DOC-01 | Docs de tecnologias, arquitetura, modelagem, regras e planejamento | Arquivos em `docs/` revisados |
| BE-00 | Esqueleto NestJS em `backend/` com prefixo `/api`, `ValidationPipe` global, `config.ts`, filtro de erros de domínio, `CLOCK` | `npm run build` e `npm test` passam |
| FE-00 | Esqueleto Vite + React + TS em `frontend/`, proxy `/api` → `localhost:3000`, Vitest configurado, `api/client.ts` com `ApiError` | `npm run build` e `npm test` passam |

---

## SPEC-01 — Busca de exames

**História:** como paciente, quero buscar um exame pelo nome para escolher o
que vou agendar.

**Regras:** PR7 (busca sem acento/maiúscula).

| Card | Descrição | Aceite |
| --- | --- | --- |
| BE-01 | `ExamesRepository` lê `dados/exames.csv` uma vez na subida | 30 exames carregados; teste unitário do parser |
| BE-02 | `GET /api/exames?nome=` | "ressonancia" retorna os 4 exames de ressonância; vazio retorna 30; teste e2e |
| FE-01 | `ExameBusca`: input com debounce de 300 ms, lista de resultados com duração, seleção | Mostra carregando, vazio ("nenhum exame encontrado") e erro; teste de componente |

---

## SPEC-02 — Agenda do médico

**História:** como paciente, quero ver os horários livres de um médico numa
data para o exame escolhido.

**Regras:** RN2, RN4, RN5, PR6.

| Card | Descrição | Aceite |
| --- | --- | --- |
| BE-03 | `medicos.data.ts` com os 5 médicos e turnos; `GET /api/medicos` | Retorna 5 médicos com turnos conforme tabela de regras |
| BE-04 | Função pura `gerarHorarios(turnos, duracao, ocupados)` | Testes cobrem os 3 exemplos do enunciado (20/30/40 min), bloqueio 09:20–10:00, agendamento desalinhado de outra duração, dois turnos no dia, intervalos encostados |
| BE-05 | `AgendaService` + `GET /api/medicos/:id/horarios?data&exameId` | Remove horários passados de hoje; data passada e dia sem turno → `[]`; 404 para médico/exame inexistente; 400 para data inválida; testes unitários com relógio fixo |
| FE-02 | `MedicoData`: escolha de médico (mostra dias de atendimento) e data (mínimo hoje) | Só habilita após escolher exame |
| FE-03 | `HorariosLista`: grade de botões com horário início–fim | Estados carregando, vazio (explica "sem expediente ou agenda cheia"), erro; teste de componente |

---

## SPEC-03 — Agendamento

**História:** como paciente, quero confirmar um horário livre informando meu
nome e receber a confirmação.

**Regras:** RN1, RN3, RN4, RN5, RN6, PR2, PR3, concorrência.

| Card | Descrição | Aceite |
| --- | --- | --- |
| BE-06 | `DatabaseModule` (better-sqlite3, schema na subida, `DB_PATH`, `:memory:` em teste) e `AgendamentosRepository` com `inserirSeLivre`; RN3 em trigger `BEFORE INSERT`, WAL ligado | Teste: inserir sobreposto lança `ConflitoError`; encostado passa; segunda conexão ao mesmo arquivo também é barrada |
| BE-07 | `AgendamentosService.criar` + `POST /api/agendamentos` + DTO validado | 201 com `fim` derivado; 400 validação; 404 ids; 422 passado e fora da grade; 409 ocupado; testes unitários e e2e |
| BE-08 | Teste e2e de concorrência | 10 POSTs simultâneos ao mesmo horário → exatamente um 201 e nove 409 |
| FE-04 | `AgendamentoForm` + `Confirmacao` | Valida nome (3–100) antes de enviar; botão desabilitado durante envio; mostra resumo; "novo agendamento" reinicia o fluxo |
| FE-05 | Tratamento de erros do POST | 409 e 422: avisam e recarregam horários; 400/404: mostram mensagem da API; falha de rede: mensagem genérica; teste |

---

## SPEC-04 — Entrega

| Card | Descrição | Aceite |
| --- | --- | --- |
| DOC-02 | README raiz: como rodar as duas pontas, portas, testes, decisões, premissas, o que ficou de fora | Passo a passo executado do zero funciona |
| DOC-03 | Exemplos `curl` de todas as rotas (sucesso e erros) | Comandos copiáveis no README |

---

## SPEC-05 — Clean Architecture no back-end

**Objetivo:** reorganizar o back-end em `domain` / `application` / `infrastructure` / `http`
sem mudar o comportamento das rotas existentes.

| Card | Descrição | Aceite |
| --- | --- | --- |
| BE-09 | Mover tipos, `gerarHorarios`, `tempo` e erros para `domain/` | Nenhum import de Nest ou SQLite em `domain/` |
| BE-10 | Ports em `application/ports` e use cases em `application/use-cases` (buscar exames, listar médicos, consultar horários, criar agendamento) | Use cases testados com ports falsos, sem Nest |
| BE-11 | Adapters em `infrastructure/` (CSV, memória, SQLite, relógio) e composição em `app.module.ts` | Todos os testes e2e anteriores passam sem alteração de contrato |
| BE-12 | Regra de dependência no ESLint (`no-restricted-imports` em `domain/` e `application/`) | Import proibido quebra `npm run lint` |

---

## SPEC-06 — Calendário de disponibilidade

**História:** como paciente, quero ver no calendário do mês quais dias têm
horários livres para o exame e médico escolhidos.

**Regras:** RN8.

| Card | Descrição | Aceite |
| --- | --- | --- |
| BE-13 | Use case `ConsultarDisponibilidade` + `GET /api/medicos/:id/disponibilidade?mes&exameId` | Todos os dias do mês; uma consulta ao banco; dia sem turno/passado = 0; agendamento reduz o total; testes unitários e e2e |
| FE-06 | Layout: topbar (logo, busca de exame), sidebar (Agendar exame, Agendamentos), tokens de cor | Responsivo; sidebar vira barra superior/inferior no celular |
| FE-07 | `Calendario` mensal (SEG–DOM) com `NavegacaoMes` (Hoje, <, mês, >) | Grade correta para qualquer mês; dia de hoje (fuso da clínica) destacado e atualizado na virada do dia; testes de `utils/datas` e `useHoje` |
| FE-08 | Tela Agendar: exame + chips de médico; células com "N livres"; dias sem vaga apagados; exames marcados do médico como `EventoCard` | Estados carregando/erro/vazio; teste |
| FE-09 | `PainelDia`: horários do dia, nome do paciente, **Agendar** | 409 avisa e recarrega dia e mês, mantendo o nome digitado mesmo ao trocar de dia ou médico; sucesso atualiza calendário e limpa o nome; teste |

---

## SPEC-07 — Listar e cancelar agendamentos

**História:** como atendente, quero ver os exames marcados no mês e cancelar
um que ainda não começou.

**Regras:** RN7, PR9, PR10.

| Card | Descrição | Aceite |
| --- | --- | --- |
| BE-14 | Use case `ListarAgendamentos` + `GET /api/agendamentos?mes[&medicoId]` | Ordenado por início; filtro por médico; 400 sem `mes`; testes |
| BE-15 | Use case `CancelarAgendamento` + `DELETE /api/agendamentos/:id` | 204; 404 inexistente; 422 já iniciado; horário volta a aparecer em `/horarios`; testes |
| FE-10 | Tela Agendamentos: calendário com `EventoCard` por exame (cor por modalidade), filtro por médico | Estados carregando/erro/vazio; teste |
| FE-11 | `PainelAgendamento`: detalhes + **Cancelar** com confirmação | 422 mostra mensagem; sucesso ou 404 (já cancelado) removem do calendário; teste |

---

## SPEC-08 — Operação

| Card | Descrição | Aceite |
| --- | --- | --- |
| BE-16 | Swagger em `/api/docs` com DTOs e respostas de erro documentados | Todas as rotas aparecem com exemplos |
| BE-17 | `GET /api/health` (checa o banco) | 200 `{status:"ok"}`; teste e2e |
| DOC-04 | GitHub Actions: lint, build e testes de back e front | Workflow verde no GitHub |

---

## SPEC-09 — Auditoria final

Revisão de código e da demo publicada. Cada card fecha um achado.

| Card | Descrição | Aceite |
| --- | --- | --- |
| BE-18 | Bordas da API | Id de rota não inteiro dá 400 em português; nome com quebra de linha ou caractere de controle dá 400 (PR3); sem cabeçalho `x-powered-by`; Swagger com título próprio; arquivo inexistente do front dá 404, não o `index.html`; testes e2e |
| FE-12 | Bordas da tela Agendar | Mês virando com a tela aberta mostra o mês novo; falha de rede ao agendar avisa que pode ter sido criado e recarrega a agenda; o aviso de 409 não repete "Escolha um horário."; foco vai para a confirmação; pílula "1 livre" no singular; testes |
| FE-13 | Bordas da tela Agendamentos | Exame que já começou não mostra "Cancelar"; foco vai para o título após cancelar; recarrega ao voltar para a aba; no celular, só dias com agendamento (e hoje); horário no formato `08:00–08:40`; testes |
| DOC-05 | Contrato completo e exemplos válidos | docs/03 lista 400 de id, 400 de `/exames` e 503 do health; campos desconhecidos documentados; datas de exemplo no futuro |

---

## Fora do escopo (próximos passos)

- Autenticação e cadastro de pacientes.
- Remarcação.
- Feriados, bloqueios de agenda e pausas.
- Postgres com `EXCLUDE USING gist` para escalar horizontalmente.
- Testes e2e de interface (Playwright).
