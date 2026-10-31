import { Body, Controller, Post } from '@nestjs/common';
import { CriarAgendamento } from '../../application/use-cases/criar-agendamento';
import { CriarAgendamentoDto } from '../dto/criar-agendamento.dto';

@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly criarAgendamento: CriarAgendamento) {}

  @Post()
  criar(@Body() dto: CriarAgendamentoDto) {
    return this.criarAgendamento.executar(dto);
  }
}
