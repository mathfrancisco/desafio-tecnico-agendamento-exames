import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { ExamesService } from './exames.service';

class BuscarExamesQuery {
  @IsOptional()
  @IsString({ message: 'nome deve ser um texto' })
  nome?: string;
}

@Controller('exames')
export class ExamesController {
  constructor(private readonly service: ExamesService) {}

  @Get()
  buscar(@Query() { nome }: BuscarExamesQuery) {
    return this.service.buscar(nome);
  }
}
