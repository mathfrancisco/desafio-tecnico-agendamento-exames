import { INestApplication } from '@nestjs/common';
import { criarApp, http } from './app';

interface AgendamentoJson {
  id: number;
  pacienteNome: string;
  exameId: number;
  medicoId: number;
  inicio: string;
  fim: string;
  criadoEm: string;
}

interface ErroJson {
  statusCode: number;
  error: string;
  message: string | string[];
}

// Relógio fixo: segunda-feira 2026-11-02 10:00. Exame 20 dura 40 min.
const valido = {
  pacienteNome: 'Maria Silva',
  exameId: 20,
  medicoId: 1,
  inicio: '2026-11-03T08:00',
};

describe('POST /api/agendamentos', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await criarApp();
  });
  afterEach(() => app.close());

  const criar = (corpo: unknown) =>
    http(app)
      .post('/api/agendamentos')
      .send(corpo as object);

  it('201 com o agendamento criado e o fim derivado', async () => {
    const res = await criar(valido);
    const corpo = res.body as AgendamentoJson;
    expect(res.status).toBe(201);
    expect(corpo).toEqual({
      id: 1,
      ...valido,
      fim: '2026-11-03T08:40',
      criadoEm: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/) as string,
    });
  });

  it('remove o horário agendado da lista de horários livres', async () => {
    await criar({ ...valido, inicio: '2026-11-03T09:20' }).expect(201);
    const res = await http(app).get(
      '/api/medicos/1/horarios?data=2026-11-03&exameId=20',
    );
    const inicios = (
      res.body as { horarios: { inicio: string }[] }
    ).horarios.map((h) => h.inicio);
    expect(inicios).not.toContain('09:20');
    expect(inicios).toContain('08:40');
    expect(inicios).toContain('10:00');
  });

  it('remove da lista os horários que cruzam um agendamento de outra duração', async () => {
    // Exame 6 (30 min) às 09:00–09:30 bloqueia 08:40 e 09:20 para exames de 40 min.
    await criar({ ...valido, exameId: 6, inicio: '2026-11-03T09:00' }).expect(
      201,
    );
    const res = await http(app).get(
      '/api/medicos/1/horarios?data=2026-11-03&exameId=20',
    );
    const inicios = (
      res.body as { horarios: { inicio: string }[] }
    ).horarios.map((h) => h.inicio);
    expect(inicios.slice(0, 3)).toEqual(['08:00', '10:00', '10:40']);
  });

  it('apara espaços do nome do paciente', async () => {
    const res = await criar({ ...valido, pacienteNome: '  Maria Silva  ' });
    expect(res.status).toBe(201);
    expect((res.body as AgendamentoJson).pacienteNome).toBe('Maria Silva');
  });

  it.each([
    ['sem corpo', {}],
    ['nome curto', { pacienteNome: 'Al' }],
    ['nome só com espaços', { pacienteNome: '     ' }],
    ['nome longo', { pacienteNome: 'a'.repeat(101) }],
    ['nome não textual', { pacienteNome: 123 }],
    ['exameId como texto', { exameId: '20' }],
    ['exameId zero', { exameId: 0 }],
    ['exameId fracionário', { exameId: 1.5 }],
    ['medicoId negativo', { medicoId: -1 }],
    ['inicio sem hora', { inicio: '2026-11-03' }],
    ['inicio com segundos', { inicio: '2026-11-03T08:00:00' }],
    ['inicio com data inexistente', { inicio: '2026-02-30T08:00' }],
    ['inicio com hora inexistente', { inicio: '2026-11-03T25:00' }],
  ])('400: %s', async (caso, alteracao) => {
    const corpo = caso === 'sem corpo' ? {} : { ...valido, ...alteracao };
    const res = await criar(corpo);
    expect(res.status).toBe(400);
    expect((res.body as ErroJson).error).toBe('Bad Request');
  });

  it('404 para exame inexistente', async () => {
    const res = await criar({ ...valido, exameId: 999 });
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ statusCode: 404, error: 'Not Found' });
  });

  it('404 para médico inexistente', async () => {
    const res = await criar({ ...valido, medicoId: 99 });
    expect(res.status).toBe(404);
  });

  it.each([
    ['no passado', '2026-11-02T08:00'],
    ['exatamente agora', '2026-11-02T10:00'],
    ['em dia sem expediente', '2026-11-07T08:00'],
    ['fora do turno', '2026-11-03T12:40'],
    ['fora da grade do exame', '2026-11-03T08:30'],
  ])('422: %s', async (_caso, inicio) => {
    const res = await criar({ ...valido, inicio });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({
      statusCode: 422,
      error: 'Unprocessable Entity',
    });
  });

  it('409 para horário já ocupado', async () => {
    await criar(valido).expect(201);
    const res = await criar({ ...valido, pacienteNome: 'João Souza' });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ statusCode: 409, error: 'Conflict' });
  });

  it('409 para horário que cruza agendamento existente de outra duração', async () => {
    await criar({ ...valido, exameId: 6, inicio: '2026-11-03T09:00' }).expect(
      201,
    );
    const res = await criar({ ...valido, inicio: '2026-11-03T08:40' });
    expect(res.status).toBe(409);
  });

  it('permite horários que apenas encostam', async () => {
    await criar(valido).expect(201); // 08:00–08:40
    await criar({ ...valido, inicio: '2026-11-03T08:40' }).expect(201);
  });

  it('permite o mesmo horário para médicos diferentes', async () => {
    // Rafael (2) atende terça 13:00–19:00.
    await criar({ ...valido, medicoId: 2, inicio: '2026-11-03T13:00' }).expect(
      201,
    );
    await criar({ ...valido, medicoId: 1, inicio: '2026-11-03T14:00' }).expect(
      201,
    );
  });
});
