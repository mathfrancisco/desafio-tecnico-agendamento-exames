import { INestApplication } from '@nestjs/common';
import type Database from 'better-sqlite3';
import { DATABASE } from '../src/infrastructure/sqlite/database';
import { criarApp, http } from './app';

describe('GET /api/health', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await criarApp();
  });
  afterEach(() => app.close());

  it('200 com status ok quando o banco responde', async () => {
    const res = await http(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('503 quando o banco não responde', async () => {
    app.get<Database.Database>(DATABASE).close();
    const res = await http(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'erro' });
  });
});
