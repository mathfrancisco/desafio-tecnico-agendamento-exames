import { Module } from '@nestjs/common';
import { MedicosController } from './medicos.controller';
import { MedicosRepository } from './medicos.repository';
import { MedicosService } from './medicos.service';

@Module({
  controllers: [MedicosController],
  providers: [MedicosRepository, MedicosService],
  exports: [MedicosService],
})
export class MedicosModule {}
