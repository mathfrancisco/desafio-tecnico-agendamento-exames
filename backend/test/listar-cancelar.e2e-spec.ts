import { INestApplication } from '@nestjs/common';
import { AGORA_FIXO, criarApp, http, Relogio } from './app';

interface AgendamentoJson {
  id: number;
  medicoId: number;
  inicio: string;
}

const inicios = (corpo: unknown) =>
  (corpo as AgendamentoJson[]).map((a) => a.inicio);

const agendamento = (parcial: object = {}) => ({
  pacienteNome: 'Maria Silva',
  exameId: 20,
  medicoId: 1,
  inicio: '2026-11-03T08:00',
  ...parcial,
});

describe('GET /api/agendamentos', () => {
  let app: INestApplication;

  // Relógio fixo: segunda-feira 2026-11-02 10:00. Exame 20 dura 40 min.
  beforeAll(async () => {
    app = await criarApp();
    const criar = (corpo: object) =>
      http(app).post('/api/agendamentos').send(corpo).expect(201);
    await criar(agendamento({ inicio: '2026-11-10T14:00' }));
    await criar(agendamento({ medicoId: 2, inicio: '2026-11-03T14:20' }));
    await criar(agendamento());
    await criar(agendamento({ inicio: '2026-12-01T08:00' }));
  });
  afterAll(() => app.close());

  const listar = (query: string) => http(app).get(`/api/agendamentos${query}`);

  it('lista os agendamentos do mês ordenados por início', async () => {
    const res = await listar('?mes=2026-11');
    expect(res.status).toBe(200);
    expect(inicios(res.body)).toEqual([
      '2026-11-03T08:00',
      '2026-11-03T14:20',
      '2026-11-10T14:00',
    ]);
    expect((res.body as AgendamentoJson[])[0]).toEqual({
      id: 3,
      ...agendamento(),
      fim: '2026-11-03T08:40',
      criadoEm: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/) as string,
    });
  });

  it('filtra por médico', async () => {
    const res = await listar('?mes=2026-11&medicoId=2');
    expect(inicios(res.body)).toEqual(['2026-11-03T14:20']);
  });

  it('mês sem agendamentos devolve lista vazia', async () => {
    const res = await listar('?mes=2027-01');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('médico inexistente no filtro devolve 404', async () => {
    expect((await listar('?mes=2026-11&medicoId=99')).status).toBe(404);
  });

  it.each([
    ['mes ausente', ''],
    ['mes com formato inválido', '?mes=2026-13'],
    ['mes com dia', '?mes=2026-11-03'],
    ['medicoId não numérico', '?mes=2026-11&medicoId=abc'],
    ['medicoId zero', '?mes=2026-11&medicoId=0'],
  ])('%s devolve 400', async (_caso, query) => {
    expect((await listar(query)).status).toBe(400);
  });
});

describe('DELETE /api/agendamentos/:id', () => {
  let app: INestApplication;
  let relogio: Relogio;

  beforeEach(async () => {
    relogio = { agora: AGORA_FIXO };
    app = await criarApp(relogio);
  });
  afterEach(() => app.close());

  const criar = async (corpo: object = agendamento()) =>
    (await http(app).post('/api/agendamentos').send(corpo).expect(201))
      .body as AgendamentoJson;
  const cancelar = (id: number | string) =>
    http(app).delete(`/api/agendamentos/${id}`);

  it('204 sem corpo e o horário volta a ser oferecido', async () => {
    const { id } = await criar();
    const res = await cancelar(id);
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    const horarios = await http(app).get(
      '/api/medicos/1/horarios?data=2026-11-03&exameId=20',
    );
    expect(
      (horarios.body as { horarios: { inicio: string }[] }).horarios.map(
        (h) => h.inicio,
      ),
    ).toContain('08:00');
    expect((await http(app).get('/api/agendamentos?mes=2026-11')).body).toEqual(
      [],
    );
  });

  it('permite agendar de novo o horário cancelado', async () => {
    const { id } = await criar();
    await cancelar(id).expect(204);
    await criar();
  });

  it('404 para agendamento inexistente ou já cancelado', async () => {
    const { id } = await criar();
    await cancelar(id).expect(204);
    expect((await cancelar(id)).status).toBe(404);
    expect((await cancelar(999)).status).toBe(404);
  });

  it('422 quando o agendamento já começou, e o registro permanece', async () => {
    const { id } = await criar();
    relogio.agora = '2026-11-03T08:00';
    const res = await cancelar(id);
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ statusCode: 422 });

    relogio.agora = AGORA_FIXO;
    const lista = await http(app).get('/api/agendamentos?mes=2026-11');
    expect(inicios(lista.body)).toEqual(['2026-11-03T08:00']);
  });

  it('um minuto antes do início ainda cancela', async () => {
    const { id } = await criar();
    relogio.agora = '2026-11-03T07:59';
    await cancelar(id).expect(204);
  });

  it.each(['abc', '1.5'])('id "%s" inválido devolve 400', async (id) => {
    expect((await cancelar(id)).status).toBe(400);
  });
});
