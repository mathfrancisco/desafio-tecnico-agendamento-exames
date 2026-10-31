import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ErrosFilter } from './erros.filter';

// Compartilhado entre main.ts e os testes e2e para que ambos tenham o mesmo comportamento HTTP.
export function configurarApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ErrosFilter());

  const documento = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Agendamento de exames de imagem')
      .setDescription(
        'Datas e horas na hora local da clínica (America/Sao_Paulo), sem offset.',
      )
      .setVersion('1.0')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, documento);
}
