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
import { CancelarAgendamento } from '../../application/use-cases/cancelar-agendamento';
import { CriarAgendamento } from '../../application/use-cases/criar-agendamento';
import { ListarAgendamentos } from '../../application/use-cases/listar-agendamentos';
import { CriarAgendamentoDto } from '../dto/criar-agendamento.dto';
import { ListarAgendamentosQuery } from '../dto/listar-agendamentos.query';

@Controller('agendamentos')
export class AgendamentosController {
  constructor(
    private readonly criarAgendamento: CriarAgendamento,
    private readonly listarAgendamentos: ListarAgendamentos,
    private readonly cancelarAgendamento: CancelarAgendamento,
  ) {}

  @Post()
  criar(@Body() dto: CriarAgendamentoDto) {
    return this.criarAgendamento.executar(dto);
  }

  @Get()
  listar(@Query() { mes, medicoId }: ListarAgendamentosQuery) {
    return this.listarAgendamentos.executar(mes, medicoId);
  }

  @Delete(':id')
  @HttpCode(204)
  cancelar(@Param('id', ParseIntPipe) id: number) {
    this.cancelarAgendamento.executar(id);
  }
}
