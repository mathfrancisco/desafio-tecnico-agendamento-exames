import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ConsultarHorarios } from '../../application/use-cases/consultar-horarios';
import { ListarMedicos } from '../../application/use-cases/listar-medicos';
import { HorariosQuery } from '../dto/horarios.query';

@Controller('medicos')
export class MedicosController {
  constructor(
    private readonly listarMedicos: ListarMedicos,
    private readonly consultarHorarios: ConsultarHorarios,
  ) {}

  @Get()
  listar() {
    return this.listarMedicos.executar();
  }

  @Get(':medicoId/horarios')
  horarios(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Query() { data, exameId }: HorariosQuery,
  ) {
    return this.consultarHorarios.executar(medicoId, exameId, data);
  }
}
