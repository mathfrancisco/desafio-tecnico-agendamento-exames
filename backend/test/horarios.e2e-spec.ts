import { INestApplication } from '@nestjs/common';
import { criarApp, http } from './app';

interface HorariosJson {
  medicoId: number;
  exameId: number;
  data: string;
  horarios: { inicio: string; fim: string }[];
}

describe('GET /api/medicos/:medicoId/horarios', () => {
  let app: INestApplication;

  // O relógio fixo é segunda-feira 2026-11-02 às 10:00; exame 20 dura 40 min.
  beforeAll(async () => {
    app = await criarApp();
  });
  afterAll(() => app.close());

  const horarios = (medicoId: number, query: string) =>
    http(app).get(`/api/medicos/${medicoId}/horarios${query}`);

  it('devolve os horários livres de um dia futuro', async () => {
    const res = await horarios(1, '?data=2026-11-03&exameId=20');
    const corpo = res.body as HorariosJson;
    expect(res.status).toBe(200);
    expect(corpo).toMatchObject({
      medicoId: 1,
      exameId: 20,
      data: '2026-11-03',
    });
    expect(corpo.horarios).toHaveLength(12);
    expect(corpo.horarios[0]).toEqual({ inicio: '08:00', fim: '08:40' });
  });

  it('não oferece horários de hoje que já passaram', async () => {
    const res = await horarios(1, '?data=2026-11-02&exameId=20');
    const inicios = (res.body as HorariosJson).horarios.map((h) => h.inicio);
    expect(inicios.slice(0, 3)).toEqual(['10:40', '11:20', '14:00']);
    expect(inicios).not.toContain('10:00');
  });

  it('data passada devolve lista vazia', async () => {
    const res = await horarios(1, '?data=2026-10-30&exameId=20');
    expect(res.status).toBe(200);
    expect((res.body as HorariosJson).horarios).toEqual([]);
  });

  it('dia sem turno devolve lista vazia', async () => {
    const res = await horarios(1, '?data=2026-11-07&exameId=20');
    expect(res.status).toBe(200);
    expect((res.body as HorariosJson).horarios).toEqual([]);
  });

  it('médico inexistente devolve 404', async () => {
    const res = await horarios(99, '?data=2026-11-03&exameId=20');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ statusCode: 404, error: 'Not Found' });
  });

  it('exame inexistente devolve 404', async () => {
    const res = await horarios(1, '?data=2026-11-03&exameId=999');
    expect(res.status).toBe(404);
  });

  it.each([
    ['data ausente', '?exameId=20'],
    ['data com formato inválido', '?data=03/11/2026&exameId=20'],
    ['data inexistente', '?data=2026-02-30&exameId=20'],
    ['exameId ausente', '?data=2026-11-03'],
    ['exameId não numérico', '?data=2026-11-03&exameId=abc'],
    ['exameId zero', '?data=2026-11-03&exameId=0'],
    ['exameId negativo', '?data=2026-11-03&exameId=-1'],
  ])('%s devolve 400', async (_caso, query) => {
    const res = await horarios(1, query);
    expect(res.status).toBe(400);
  });

  it('medicoId não numérico devolve 400', async () => {
    const res = await http(app).get(
      '/api/medicos/abc/horarios?data=2026-11-03&exameId=20',
    );
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'medicoId deve ser um número inteiro',
    });
  });
});
