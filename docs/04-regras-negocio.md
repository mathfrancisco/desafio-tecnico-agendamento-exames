# 04 — Regras de negócio

Regras do enunciado (RN) e premissas adotadas onde o enunciado deixa em aberto (PR).

## Regras

**RN1 — Duração dinâmica.** Um agendamento ocupa exatamente
`duracaoMinutos` do exame: `fim = inicio + duracaoMinutos`.

**RN2 — Geração de horários.** Para cada turno do médico no dia da semana da
data: começa no início do turno e avança em passos iguais à duração do exame.
O horário `h` é oferecido se:

- `h + duracao <= fimDoTurno` (cabe inteiro no turno), e
- `[h, h + duracao)` não cruza nenhum agendamento já marcado para o médico.

Exemplo, turno 08:00–12:00, exame de 40 min:
`08:00, 08:40, 09:20, 10:00, 10:40, 11:20`. Com um agendamento 09:20–10:00
já marcado, `09:20` sai da lista; os demais ficam.

A grade não "se realinha" depois de um agendamento existente: os passos são
sempre contados a partir do início do turno.

**RN3 — Sem sobreposição.** Um médico não tem dois agendamentos cujos
intervalos `[inicio, fim)` se cruzem. Intervalos que apenas encostam são
permitidos. Garantido no banco dentro de transação (ver arquitetura).

**RN4 — Dentro do expediente.** Só se agenda em dia e turno do médico.

**RN5 — Sem passado.** Não se agenda início `<=` agora (hora local da
clínica). Na listagem, horários de hoje que já passaram não são oferecidos.

**RN6 — Dados mínimos.** `pacienteNome`, `exameId`, `medicoId`, `inicio`.
`fim` é derivado.

## Premissas

**PR1 — Fuso.** Toda agenda está em `America/Sao_Paulo` (clínica em MG). A
API recebe e devolve hora local sem offset (`YYYY-MM-DDTHH:mm`). O Brasil não
tem horário de verão desde 2019.

**PR2 — Início precisa estar na grade.** `POST /agendamentos` só aceita um
`inicio` que a RN2 ofereceria para aquele exame (alinhado ao passo a partir do
início do turno). Assim RN2 e RN4 são verificadas pela mesma função, e a API
aceita exatamente o que o front mostra. Fora disso: 422.

**PR3 — Nome do paciente.** Obrigatório, sem espaços nas pontas, 3 a 100
caracteres. Não há cadastro de paciente: um agendamento guarda o nome.

**PR4 — Mesmo paciente.** Não há regra que impeça o mesmo nome em dois
médicos no mesmo horário (paciente não é identificado de forma única).

**PR5 — Todos os médicos fazem todos os exames** (enunciado).

**PR6 — Data na listagem.** Data passada ou dia sem turno retornam lista vazia
(200), não erro. O front explica o motivo ao usuário.

**PR7 — Busca.** Por trecho do nome, sem diferenciar maiúsculas e acentos
("ressonancia" encontra "Ressonância").

**PR8 — Horizonte.** Não há limite de quão longe no futuro se pode agendar.

## Turnos dos médicos

| Médico | SEG | TER | QUA | QUI | SEX | SAB | DOM |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Dra. Helena Marques (CRM-MG 11111) | 08–12, 14–18 | 08–12, 14–18 | 08–12, 14–18 | 08–12, 14–18 | 08–12, 14–18 | — | — |
| 2 Dr. Rafael Teixeira (CRM-MG 22222) | 07–13 | 13–19 | 07–13 | 13–19 | 07–13 | — | — |
| 3 Dra. Beatriz Nogueira (CRM-MG 33333) | 09–12, 18–22 | 09–12, 18–22 | 09–12, 18–22 | 09–12, 18–22 | — | — | — |
| 4 Dr. Thiago Fontes (CRM-MG 44444) | — | 08–12 | 08–12, 19–22 | 08–12 | 08–12, 19–22 | 08–12 | — |
| 5 Dra. Camila Andrade (CRM-MG 55555) | 10–14 | 10–14 | 10–14 | 10–14 | 10–14 | 08–12 | — |
