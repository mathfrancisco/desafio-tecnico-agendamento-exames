import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ConsultarDisponibilidade } from '../../application/use-cases/consultar-disponibilidade';
import { ConsultarHorarios } from '../../application/use-cases/consultar-horarios';
import { ListarMedicos } from '../../application/use-cases/listar-medicos';
import { DisponibilidadeQuery } from '../dto/disponibilidade.query';
import { HorariosQuery } from '../dto/horarios.query';

@Controller('medicos')
export class MedicosController {
  constructor(
    private readonly listarMedicos: ListarMedicos,
    private readonly consultarHorarios: ConsultarHorarios,
    private readonly consultarDisponibilidade: ConsultarDisponibilidade,
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

  @Get(':medicoId/disponibilidade')
  disponibilidade(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Query() { mes, exameId }: DisponibilidadeQuery,
  ) {
    return this.consultarDisponibilidade.executar(medicoId, exameId, mes);
  }
}
