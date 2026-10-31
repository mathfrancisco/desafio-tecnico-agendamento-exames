import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configurarApp } from './http/app.setup';
import { servirFrontend } from './http/servir-frontend';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configurarApp(app);
  const { port, frontendDist } = config();
  if (frontendDist) servirFrontend(app, frontendDist);
  app.enableShutdownHooks();
  await app.listen(port);
}
void bootstrap();
