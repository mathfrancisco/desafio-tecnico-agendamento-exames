import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ConsultarDisponibilidade } from '../../application/use-cases/consultar-disponibilidade';
import { ConsultarHorarios } from '../../application/use-cases/consultar-horarios';
import { ListarMedicos } from '../../application/use-cases/listar-medicos';
import { ApiErros } from '../api-erros';
import { parseId } from '../parse-id.pipe';
import { DisponibilidadeQuery } from '../dto/disponibilidade.query';
import { HorariosQuery } from '../dto/horarios.query';
import {
  DisponibilidadeResposta,
  HorariosResposta,
  MedicoResposta,
} from '../dto/respostas';

@ApiTags('Médicos')
@Controller('medicos')
export class MedicosController {
  constructor(
    private readonly listarMedicos: ListarMedicos,
    private readonly consultarHorarios: ConsultarHorarios,
    private readonly consultarDisponibilidade: ConsultarDisponibilidade,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista os médicos e seus turnos' })
  @ApiOkResponse({ type: [MedicoResposta] })
  listar() {
    return this.listarMedicos.executar();
  }

  @Get(':medicoId/horarios')
  @ApiOperation({
    summary: 'Horários livres do médico numa data',
    description:
      'Dia sem turno, data passada ou agenda cheia devolvem `horarios: []`.',
  })
  @ApiParam({ name: 'medicoId', example: 1 })
  @ApiOkResponse({ type: HorariosResposta })
  @ApiErros(400, 404)
  horarios(
    @Param('medicoId', parseId('medicoId')) medicoId: number,
    @Query() { data, exameId }: HorariosQuery,
  ) {
    return this.consultarHorarios.executar(medicoId, exameId, data);
  }

  @Get(':medicoId/disponibilidade')
  @ApiOperation({
    summary: 'Total de horários livres por dia do mês',
    description:
      'Mesma regra de `/horarios` aplicada a cada dia. Traz todos os dias do mês; dia sem turno ou passado tem `livres: 0`.',
  })
  @ApiParam({ name: 'medicoId', example: 1 })
  @ApiOkResponse({ type: DisponibilidadeResposta })
  @ApiErros(400, 404)
  disponibilidade(
    @Param('medicoId', parseId('medicoId')) medicoId: number,
    @Query() { mes, exameId }: DisponibilidadeQuery,
  ) {
    return this.consultarDisponibilidade.executar(medicoId, exameId, mes);
  }
}
