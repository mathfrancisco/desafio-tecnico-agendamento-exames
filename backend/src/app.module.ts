import { Module } from '@nestjs/common';
import { AgendamentosModule } from './agendamentos/agendamentos.module';
import { ExamesModule } from './exames/exames.module';
import { MedicosModule } from './medicos/medicos.module';

@Module({ imports: [ExamesModule, MedicosModule, AgendamentosModule] })
export class AppModule {}
