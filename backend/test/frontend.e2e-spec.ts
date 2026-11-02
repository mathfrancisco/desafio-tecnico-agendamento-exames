import { INestApplication } from '@nestjs/common';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { criarApp, http, AGORA_FIXO } from './app';

describe('Build do front servido pela API', () => {
  let app: INestApplication;
  let dist: string;

  beforeAll(async () => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'front-'));
    fs.writeFileSync(path.join(dist, 'index.html'), '<div id="root"></div>');
    fs.mkdirSync(path.join(dist, 'assets'));
    fs.writeFileSync(path.join(dist, 'assets', 'app.js'), 'console.log(1)');
    app = await criarApp({ agora: AGORA_FIXO }, dist);
  });
  afterAll(async () => {
    await app.close();
    fs.rmSync(dist, { recursive: true, force: true });
  });

  it('rota do front cai no index.html', async () => {
    const res = await http(app).get('/agendamentos');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<div id="root">');
  });

  it('serve os arquivos do build', async () => {
    const res = await http(app).get('/assets/app.js');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
  });

  it('arquivo inexistente devolve 404, não o index.html', async () => {
    const res = await http(app).get('/assets/antigo.js');
    expect(res.status).toBe(404);
  });

  it('rota inexistente da API continua 404 em JSON', async () => {
    const res = await http(app).get('/api/inexistente');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });
});
