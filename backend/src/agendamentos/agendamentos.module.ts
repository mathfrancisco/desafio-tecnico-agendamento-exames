import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ExamesModule } from '../exames/exames.module';
import { MedicosModule } from '../medicos/medicos.module';
import { CLOCK, SystemClock } from '../shared/clock';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { AgendamentosController } from './agendamentos.controller';
import { AgendamentosRepository } from './agendamentos.repository';
import { AgendamentosService } from './agendamentos.service';

@Module({
  imports: [DatabaseModule, ExamesModule, MedicosModule],
  controllers: [AgendaController, AgendamentosController],
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    AgendamentosRepository,
    AgendaService,
    AgendamentosService,
  ],
})
export class AgendamentosModule {}
