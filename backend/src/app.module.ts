import { Module } from '@nestjs/common';
import { ExamesModule } from './exames/exames.module';
import { MedicosModule } from './medicos/medicos.module';

@Module({ imports: [ExamesModule, MedicosModule] })
export class AppModule {}
