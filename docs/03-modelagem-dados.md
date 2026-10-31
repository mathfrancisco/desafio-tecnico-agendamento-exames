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
  `America/Sao_Paulo`, sem offset no texto: `2026-11-03T09:20`.
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
```

Sem chave estrangeira para exame/médico: eles não estão no banco (catálogo
fixo em memória). A integridade é garantida no service, que valida os ids antes
de inserir.

### Consulta de sobreposição

Dois intervalos `[a1, a2)` e `[b1, b2)` se cruzam quando `a1 < b2 AND b1 < a2`.
Intervalos encostados (um termina 09:20, outro começa 09:20) **não** se cruzam.

```sql
SELECT 1 FROM agendamentos
 WHERE medico_id = :medicoId
   AND inicio < :fim
   AND fim    > :inicio
 LIMIT 1;
```

## Contrato da API

Prefixo `/api`. JSON em camelCase.

### `GET /api/exames?nome=<texto>`

Busca por trecho do nome, sem diferenciar maiúsculas nem acentos.
`nome` ausente ou vazio retorna o catálogo inteiro. Ordenado por nome.

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
  "medicoId": 1, "exameId": 7, "data": "2026-11-03",
  "horarios": [{ "inicio": "08:00", "fim": "08:40" }, ...]
}
```

- Dia sem turno, data passada ou agenda cheia: `horarios: []` (200).
- Médico ou exame inexistente: 404. `data`/`exameId` inválidos: 400.

### `POST /api/agendamentos`

```json
{ "pacienteNome": "Maria Silva", "exameId": 7, "medicoId": 1, "inicio": "2026-11-03T08:00" }
```

Resposta 201:

```json
{
  "id": 1, "pacienteNome": "Maria Silva", "exameId": 7, "medicoId": 1,
  "inicio": "2026-11-03T08:00", "fim": "2026-11-03T08:40",
  "criadoEm": "2026-10-31T15:00:00.000Z"
}
```

Erros: 400 (validação), 404 (exame/médico), 422 (passado/fora da grade),
409 (horário ocupado).
