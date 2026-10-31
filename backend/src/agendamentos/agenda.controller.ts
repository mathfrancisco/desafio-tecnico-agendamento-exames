import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { HorariosQuery } from './dto/horarios.query';

@Controller('medicos')
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

  @Get(':medicoId/horarios')
  horarios(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Query() { data, exameId }: HorariosQuery,
  ) {
    return this.service.horariosLivres(medicoId, exameId, data);
  }
}
