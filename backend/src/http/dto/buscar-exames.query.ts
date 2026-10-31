import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BuscarExamesQuery {
  @ApiPropertyOptional({
    example: 'ressonancia',
    description: 'Trecho do nome, sem diferenciar maiúsculas nem acentos',
  })
  @IsOptional()
  @IsString({ message: 'nome deve ser um texto' })
  nome?: string;
}
