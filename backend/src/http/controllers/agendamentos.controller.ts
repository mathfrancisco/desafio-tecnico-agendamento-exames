import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CancelarAgendamento } from '../../application/use-cases/cancelar-agendamento';
import { CriarAgendamento } from '../../application/use-cases/criar-agendamento';
import { ListarAgendamentos } from '../../application/use-cases/listar-agendamentos';
import { ApiErros } from '../api-erros';
import { CriarAgendamentoDto } from '../dto/criar-agendamento.dto';
import { ListarAgendamentosQuery } from '../dto/listar-agendamentos.query';
import { AgendamentoResposta } from '../dto/respostas';

@ApiTags('Agendamentos')
@Controller('agendamentos')
export class AgendamentosController {
  constructor(
    private readonly criarAgendamento: CriarAgendamento,
    private readonly listarAgendamentos: ListarAgendamentos,
    private readonly cancelarAgendamento: CancelarAgendamento,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cria um agendamento',
    description:
      'O `fim` é derivado da duração do exame. O `inicio` precisa estar na grade do médico e no futuro.',
  })
  @ApiCreatedResponse({ type: AgendamentoResposta })
  @ApiErros(400, 404, 409, 422)
  criar(@Body() dto: CriarAgendamentoDto) {
    return this.criarAgendamento.executar(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os agendamentos do mês',
    description: 'Ordenado por início; `medicoId` opcional filtra por médico.',
  })
  @ApiOkResponse({ type: [AgendamentoResposta] })
  @ApiErros(400, 404)
  listar(@Query() { mes, medicoId }: ListarAgendamentosQuery) {
    return this.listarAgendamentos.executar(mes, medicoId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Cancela um agendamento',
    description:
      'Remove o registro e libera o horário. Só antes do início (hora local da clínica).',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiNoContentResponse({ description: 'Cancelado' })
  @ApiErros(400, 404, 422)
  cancelar(@Param('id', ParseIntPipe) id: number) {
    this.cancelarAgendamento.executar(id);
  }
}
