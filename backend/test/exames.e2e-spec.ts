import { INestApplication } from '@nestjs/common';
import { criarApp, http } from './app';

interface ExameJson {
  id: number;
  nome: string;
  duracaoMinutos: number;
}

describe('GET /api/exames', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await criarApp();
  });
  afterAll(() => app.close());

  const buscar = (query = '') => http(app).get(`/api/exames${query}`);

  it('sem nome devolve os 30 exames ordenados por nome', async () => {
    const res = await buscar();
    const exames = res.body as ExameJson[];
    expect(res.status).toBe(200);
    expect(exames).toHaveLength(30);
    const nomes = exames.map((e) => e.nome);
    expect(nomes).toEqual(
      [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    );
  });

  it('nome vazio devolve os 30 exames', async () => {
    const res = await buscar('?nome=');
    expect(res.body as ExameJson[]).toHaveLength(30);
  });

  it('"ressonancia" devolve as 4 ressonâncias, sem acento e sem maiúsculas', async () => {
    const res = await buscar('?nome=ressonancia');
    const exames = res.body as ExameJson[];
    expect(exames).toHaveLength(4);
    expect(exames.every((e) => e.nome.includes('Ressonância'))).toBe(true);
    expect(exames[0]).toEqual({
      id: 22,
      nome: 'Ressonância Magnética de Coluna Lombar',
      duracaoMinutos: 40,
    });
  });

  it('nome sem correspondência devolve lista vazia', async () => {
    const res = await buscar('?nome=zzz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
