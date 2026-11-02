# 03 — Modelagem de dados

## Entidades

```
Exame (catálogo, memória)      Medico (catálogo, memória)
  id: number                     id: number
  nome: string                   nome: string
  duracaoMinutos: 20|30|40       crm: string
                                 turnos: Turno[]
          \                        /
           \                      /
            Agendamento (SQLite)
              id: number
              pacienteNome: string
              exameId: number   -> Exame.id
              medicoId: number  -> Medico.id
              inicio: 'YYYY-MM-DDTHH:mm'
              fim:    'YYYY-MM-DDTHH:mm'   (inicio + duração do exame)
              criadoEm: ISO-8601 UTC

Turno
  dia: 'SEG'|'TER'|'QUA'|'QUI'|'SEX'|'SAB'|'DOM'
  inicio: 'HH:MM'
  fim: 'HH:MM'
```

## Datas e horas

- Todas as datas/horas de agenda estão no **horário local da clínica**,
  `America/Sao_Paulo`, sem offset no texto: `2027-03-02T09:20`.
- Formato fixo e com zeros à esquerda: comparação de texto equivale a
  comparação cronológica. Isso deixa a checagem de sobreposição em SQL simples.
- Nenhum turno cruza a meia-noite (o mais tarde termina 22:00), então início e
  fim de um agendamento caem sempre na mesma data.
- `criadoEm` é auditoria, em UTC (`new Date().toISOString()`).

## Schema SQLite

```sql
CREATE TABLE IF NOT EXISTS agendamentos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_nome TEXT    NOT NULL,
  exame_id      INTEGER NOT NULL,
  medico_id     INTEGER NOT NULL,
  inicio        TEXT    NOT NULL,  -- YYYY-MM-DDTHH:mm, hora local da clínica
  fim           TEXT    NOT NULL,  -- inicio + duração do exame
  criado_em     TEXT    NOT NULL,  -- ISO-8601 UTC
  CHECK (fim > inicio)
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_medico_inicio
  ON agendamentos (medico_id, inicio);

-- RN3: aborta o INSERT que cruza outro agendamento do mesmo médico.
CREATE TRIGGER IF NOT EXISTS agendamentos_sem_sobreposicao
BEFORE INSERT ON agendamentos
WHEN EXISTS (
  SELECT 1 FROM agendamentos
   WHERE medico_id = NEW.medico_id
     AND inicio < NEW.fim
     AND fim > NEW.inicio
)
BEGIN
  SELECT RAISE(ABORT, 'agendamento sobreposto');
END;
```

A conexão liga `journal_mode = WAL` na subida (ver arquitetura, Concorrência).
Não há `UPDATE` de agendamento (cancelar apaga, PR9), por isso o trigger cobre
só o `INSERT`.

O `exames.csv` é validado na subida: exatamente 3 colunas, id inteiro, nome
preenchido e duração inteira positiva (a grade conta em minutos). Linha
inválida impede a API de subir.

Sem chave estrangeira para exame/médico: eles não estão no banco (catálogo
fixo em memória). A integridade é garantida no service, que valida os ids antes
de inserir.

### Consulta de sobreposição

Dois intervalos `[a1, a2)` e `[b1, b2)` se cruzam quando `a1 < b2 AND b1 < a2`.
Intervalos encostados (um termina 09:20, outro começa 09:20) **não** se cruzam.

É o `WHEN EXISTS (...)` do trigger acima, com `NEW` sendo o agendamento novo.
O índice `(medico_id, inicio)` atende essa busca.

## Contrato da API

Prefixo `/api`. JSON em camelCase.

Erros vêm como `{ "statusCode": 400, "error": "Bad Request", "message": "..." }`.
Em 400 de validação, `message` pode ser uma lista com um texto por campo.
Valem para todas as rotas:

- Id de rota que não é inteiro (`/agendamentos/abc`, `/medicos/1.5/horarios`):
  400 com `id deve ser um número inteiro` (ou `medicoId ...`).
- Campos do corpo e parâmetros de query desconhecidos são descartados, sem 400.
  Um parâmetro com nome errado é ignorado: `?medicold=1` lista todos os médicos.

### `GET /api/exames?nome=<texto>`

Busca por trecho do nome, sem diferenciar maiúsculas nem acentos.
`nome` ausente ou vazio retorna o catálogo inteiro. Ordenado por nome.
`nome` repetido (`?nome=a&nome=b`): 400.

```json
[{ "id": 20, "nome": "Ressonância Magnética de Crânio", "duracaoMinutos": 40 }]
```

### `GET /api/medicos`

```json
[{
  "id": 1, "nome": "Dra. Helena Marques", "crm": "CRM-MG 11111",
  "turnos": [{ "dia": "SEG", "inicio": "08:00", "fim": "12:00" }, ...]
}]
```

### `GET /api/medicos/:medicoId/horarios?data=YYYY-MM-DD&exameId=<id>`

Horários livres do médico naquela data para aquele exame.

```json
{
  "medicoId": 1, "exameId": 7, "data": "2027-03-02",
  "horarios": [{ "inicio": "08:00", "fim": "08:40" }, ...]
}
```

- Dia sem turno, data passada ou agenda cheia: `horarios: []` (200).
- Médico ou exame inexistente: 404. `data`/`exameId` inválidos: 400.

### `POST /api/agendamentos`

```json
{ "pacienteNome": "Maria Silva", "exameId": 7, "medicoId": 1, "inicio": "2027-03-02T08:00" }
```

Resposta 201:

```json
{
  "id": 1, "pacienteNome": "Maria Silva", "exameId": 7, "medicoId": 1,
  "inicio": "2027-03-02T08:00", "fim": "2027-03-02T08:40",
  "criadoEm": "2026-10-31T15:00:00.000Z"
}
```

Erros: 400 (validação; inclui nome com quebra de linha, tab ou outro
caractere de controle), 404 (exame/médico), 422 (passado/fora da grade),
409 (horário ocupado).

### `GET /api/medicos/:medicoId/disponibilidade?mes=YYYY-MM&exameId=<id>`

Total de horários livres por dia do mês, para o calendário. Mesma regra de
`/horarios` aplicada a cada dia (uma consulta ao banco para o mês inteiro).

```json
{
  "medicoId": 1, "exameId": 7, "mes": "2027-03",
  "dias": [
    { "data": "2027-03-01", "livres": 12 },
    ...
    { "data": "2027-03-06", "livres": 0 }
  ]
}
```

- `dias` traz todos os dias do mês, em ordem. Dia sem turno ou passado: `livres: 0`.
- Médico ou exame inexistente: 404. `mes`/`exameId` inválidos: 400.

### `GET /api/agendamentos?mes=YYYY-MM[&medicoId=<id>]`

Agendamentos do mês, ordenados por `inicio`. `medicoId` opcional filtra por médico.

```json
[{
  "id": 1, "pacienteNome": "Maria Silva", "exameId": 7, "medicoId": 1,
  "inicio": "2027-03-02T08:00", "fim": "2027-03-02T08:40",
  "criadoEm": "2026-10-31T15:00:00.000Z"
}]
```

`mes` inválido ou ausente: 400. Médico inexistente no filtro: 404.

### `DELETE /api/agendamentos/:id`

Cancela (remove) o agendamento e libera o horário. Resposta 204 sem corpo.
`id` não inteiro: 400. Inexistente: 404. Já iniciado ou passado: 422.

### `GET /api/health`

`{ "status": "ok" }` (200) quando o banco responde; `{ "status": "erro" }` (503)
quando não responde.

### `GET /api/docs`

Swagger UI com o contrato acima.
