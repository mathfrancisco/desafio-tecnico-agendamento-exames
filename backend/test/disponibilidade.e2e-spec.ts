import { INestApplication } from '@nestjs/common';
import { criarApp, http } from './app';

interface DisponibilidadeJson {
  medicoId: number;
  exameId: number;
  mes: string;
  dias: { data: string; livres: number }[];
}

describe('GET /api/medicos/:medicoId/disponibilidade', () => {
  let app: INestApplication;

  // O relógio fixo é segunda-feira 2026-11-02 às 10:00; exame 20 dura 40 min.
  beforeAll(async () => {
    app = await criarApp();
  });
  afterAll(() => app.close());

  const disponibilidade = (medicoId: number | string, query: string) =>
    http(app).get(`/api/medicos/${medicoId}/disponibilidade${query}`);
  const livresEm = (corpo: DisponibilidadeJson, data: string) =>
    corpo.dias.find((d) => d.data === data)?.livres;

  it('devolve todos os dias do mês com o total de horários livres', async () => {
    const res = await disponibilidade(1, '?mes=2026-11&exameId=20');
    const corpo = res.body as DisponibilidadeJson;
    expect(res.status).toBe(200);
    expect(corpo).toMatchObject({ medicoId: 1, exameId: 20, mes: '2026-11' });
    expect(corpo.dias).toHaveLength(30);
    expect(corpo.dias[0]).toEqual({ data: '2026-11-01', livres: 0 });
    expect(livresEm(corpo, '2026-11-02')).toBe(8); // hoje: só o que não começou
    expect(livresEm(corpo, '2026-11-03')).toBe(12);
    expect(livresEm(corpo, '2026-11-07')).toBe(0); // sábado, sem expediente
  });

  it('mês passado devolve só zeros', async () => {
    const res = await disponibilidade(1, '?mes=2026-10&exameId=20');
    const corpo = res.body as DisponibilidadeJson;
    expect(res.status).toBe(200);
    expect(corpo.dias).toHaveLength(31);
    expect(corpo.dias.every((d) => d.livres === 0)).toBe(true);
  });

  it('um agendamento reduz o total do dia e bate com /horarios', async () => {
    const criado = await http(app).post('/api/agendamentos').send({
      pacienteNome: 'Maria Silva',
      exameId: 20,
      medicoId: 1,
      inicio: '2026-11-04T08:00',
    });
    expect(criado.status).toBe(201);

    const res = await disponibilidade(1, '?mes=2026-11&exameId=20');
    const corpo = res.body as DisponibilidadeJson;
    expect(livresEm(corpo, '2026-11-04')).toBe(11);
    expect(livresEm(corpo, '2026-11-05')).toBe(12);

    const horarios = await http(app).get(
      '/api/medicos/1/horarios?data=2026-11-04&exameId=20',
    );
    expect((horarios.body as { horarios: unknown[] }).horarios).toHaveLength(
      11,
    );
  });

  it('médico ou exame inexistente devolve 404', async () => {
    expect((await disponibilidade(99, '?mes=2026-11&exameId=20')).status).toBe(
      404,
    );
    expect((await disponibilidade(1, '?mes=2026-11&exameId=999')).status).toBe(
      404,
    );
  });

  it.each([
    ['mes ausente', '?exameId=20'],
    ['mes com formato inválido', '?mes=11/2026&exameId=20'],
    ['mes com dia', '?mes=2026-11-01&exameId=20'],
    ['mes 13', '?mes=2026-13&exameId=20'],
    ['mes 00', '?mes=2026-00&exameId=20'],
    ['exameId ausente', '?mes=2026-11'],
    ['exameId não numérico', '?mes=2026-11&exameId=abc'],
    ['exameId zero', '?mes=2026-11&exameId=0'],
  ])('%s devolve 400', async (_caso, query) => {
    expect((await disponibilidade(1, query)).status).toBe(400);
  });

  it('medicoId não numérico devolve 400', async () => {
    expect(
      (await disponibilidade('abc', '?mes=2026-11&exameId=20')).status,
    ).toBe(400);
  });
});
