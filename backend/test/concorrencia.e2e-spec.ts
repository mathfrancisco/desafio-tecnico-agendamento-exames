import { INestApplication } from '@nestjs/common';
import { criarApp, http } from './app';

describe('Concorrência em POST /api/agendamentos', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await criarApp();
  });
  afterAll(() => app.close());

  it('10 pedidos simultâneos para o mesmo horário geram exatamente um 201 e nove 409', async () => {
    const pedidos = Array.from({ length: 10 }, (_, i) =>
      http(app)
        .post('/api/agendamentos')
        .send({
          pacienteNome: `Paciente ${i + 1}`,
          exameId: 20,
          medicoId: 1,
          inicio: '2026-11-03T08:00',
        }),
    );

    const respostas = await Promise.all(pedidos);
    const status = respostas.map((r) => r.status);

    expect(status.filter((s) => s === 201)).toHaveLength(1);
    expect(status.filter((s) => s === 409)).toHaveLength(9);

    const agenda = await http(app).get(
      '/api/medicos/1/horarios?data=2026-11-03&exameId=20',
    );
    const inicios = (
      agenda.body as { horarios: { inicio: string }[] }
    ).horarios.map((h) => h.inicio);
    expect(inicios).not.toContain('08:00');
  });

  it('pedidos simultâneos com horários que se cruzam permitem apenas um deles', async () => {
    // 14:00–14:40 (exame de 40 min) e 14:30–15:00 (exame de 30 min) se cruzam.
    const respostas = await Promise.all([
      http(app).post('/api/agendamentos').send({
        pacienteNome: 'Paciente A',
        exameId: 20,
        medicoId: 1,
        inicio: '2026-11-04T14:00', // 14:00–14:40
      }),
      http(app).post('/api/agendamentos').send({
        pacienteNome: 'Paciente B',
        exameId: 6,
        medicoId: 1,
        inicio: '2026-11-04T14:30', // 14:30–15:00
      }),
    ]);
    expect(respostas.map((r) => r.status).sort()).toEqual([201, 409]);
  });
});
