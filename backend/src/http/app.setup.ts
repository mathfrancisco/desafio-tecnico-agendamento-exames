import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ErrosFilter } from './erros.filter';

// Compartilhado entre main.ts e os testes e2e para que ambos tenham o mesmo comportamento HTTP.
export function configurarApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ErrosFilter());
}
