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
| BE-06 | `DatabaseModule` (better-sqlite3, schema na subida, `DB_PATH`, `:memory:` em teste) e `AgendamentosRepository` com `inserirSeLivre` em transação `IMMEDIATE` | Teste: inserir sobreposto lança `ConflitoError`; encostado passa |
| BE-07 | `AgendamentosService.criar` + `POST /api/agendamentos` + DTO validado | 201 com `fim` derivado; 400 validação; 404 ids; 422 passado e fora da grade; 409 ocupado; testes unitários e e2e |
| BE-08 | Teste e2e de concorrência | 10 POSTs simultâneos ao mesmo horário → exatamente um 201 e nove 409 |
| FE-04 | `AgendamentoForm` + `Confirmacao` | Valida nome (3–100) antes de enviar; botão desabilitado durante envio; mostra resumo; "novo agendamento" reinicia o fluxo |
| FE-05 | Tratamento de erros do POST | 409: avisa e recarrega horários; 422/400/404: mostra mensagem da API; falha de rede: mensagem genérica; teste |

---

## SPEC-04 — Entrega

| Card | Descrição | Aceite |
| --- | --- | --- |
| DOC-02 | README raiz: como rodar as duas pontas, portas, testes, decisões, premissas, o que ficou de fora | Passo a passo executado do zero funciona |
| DOC-03 | Exemplos `curl` de todas as rotas (sucesso e erros) | Comandos copiáveis no README |

---

## Fora do escopo (próximos passos)

- Autenticação e cadastro de pacientes.
- Cancelamento e remarcação.
- Listagem de agendamentos por paciente/médico.
- Feriados, bloqueios de agenda e pausas.
- Postgres com `EXCLUDE USING gist` para escalar horizontalmente.
- Testes e2e de interface (Playwright).
