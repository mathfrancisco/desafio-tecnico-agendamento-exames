import { Controller, Get, Query } from '@nestjs/common';
import { BuscarExames } from '../../application/use-cases/buscar-exames';
import { BuscarExamesQuery } from '../dto/buscar-exames.query';

@Controller('exames')
export class ExamesController {
  constructor(private readonly buscarExames: BuscarExames) {}

  @Get()
  buscar(@Query() { nome }: BuscarExamesQuery) {
    return this.buscarExames.executar(nome);
  }
}
