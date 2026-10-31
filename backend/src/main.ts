import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './http/app.setup';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  await app.listen(config().port);
}
void bootstrap();
