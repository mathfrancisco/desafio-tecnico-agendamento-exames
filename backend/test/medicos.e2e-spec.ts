import { INestApplication } from '@nestjs/common';
import { criarApp, http } from './app';

interface MedicoJson {
  id: number;
  nome: string;
  crm: string;
  turnos: { dia: string; inicio: string; fim: string }[];
}

describe('GET /api/medicos', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await criarApp();
  });
  afterAll(() => app.close());

  it('devolve os 5 médicos com seus turnos', async () => {
    const res = await http(app).get('/api/medicos');
    const medicos = res.body as MedicoJson[];
    expect(res.status).toBe(200);
    expect(medicos.map((m) => m.id)).toEqual([1, 2, 3, 4, 5]);
    expect(medicos[0]).toMatchObject({
      nome: 'Dra. Helena Marques',
      crm: 'CRM-MG 11111',
    });
    expect(medicos[0].turnos[0]).toEqual({
      dia: 'SEG',
      inicio: '08:00',
      fim: '12:00',
    });
    expect(medicos[0].turnos).toHaveLength(10);
  });
});
