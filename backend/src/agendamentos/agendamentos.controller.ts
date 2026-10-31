import { Body, Controller, Post } from '@nestjs/common';
import { AgendamentosService } from './agendamentos.service';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';

@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly service: AgendamentosService) {}

  @Post()
  criar(@Body() dto: CriarAgendamentoDto) {
    return this.service.criar(dto);
  }
}
