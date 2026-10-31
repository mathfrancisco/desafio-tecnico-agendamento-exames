import { INestApplication } from '@nestjs/common';
import { criarApp, http } from './app';

interface OpenApi {
  paths: Record<string, Record<string, { responses: Record<string, unknown> }>>;
}

describe('Swagger em /api/docs', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await criarApp();
  });
  afterAll(() => app.close());

  it('serve a interface HTML', async () => {
    const res = await http(app).get('/api/docs');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('documenta todas as rotas com os erros que cada uma devolve', async () => {
    const res = await http(app).get('/api/docs-json');
    const { paths } = res.body as OpenApi;
    const codigos = (caminho: string, metodo: string) =>
      Object.keys(paths[caminho][metodo].responses).sort();

    expect(Object.keys(paths).sort()).toEqual([
      '/api/agendamentos',
      '/api/agendamentos/{id}',
      '/api/exames',
      '/api/medicos',
      '/api/medicos/{medicoId}/disponibilidade',
      '/api/medicos/{medicoId}/horarios',
    ]);
    expect(codigos('/api/agendamentos', 'post')).toEqual([
      '201',
      '400',
      '404',
      '409',
      '422',
    ]);
    expect(codigos('/api/agendamentos/{id}', 'delete')).toEqual([
      '204',
      '400',
      '404',
      '422',
    ]);
    expect(codigos('/api/medicos/{medicoId}/horarios', 'get')).toEqual([
      '200',
      '400',
      '404',
    ]);
  });
});
