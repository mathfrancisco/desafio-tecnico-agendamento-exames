import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/http/app.setup';
import { CLOCK } from '../src/application/ports/clock';

export const http = (app: INestApplication) =>
  request(app.getHttpServer() as App);

// 2026-11-02 é uma segunda-feira.
export const AGORA_FIXO = '2026-11-02T10:00';

/** Sobe a aplicação com banco em memória e relógio fixo. */
export async function criarApp(agora = AGORA_FIXO): Promise<INestApplication> {
  process.env.DB_PATH = ':memory:';
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CLOCK)
    .useValue({ agoraLocal: () => agora })
    .compile();
  const app = modulo.createNestApplication();
  configurarApp(app);
  await app.init();
  return app;
}
