import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { IsDataReal } from './validadores';

export class HorariosQuery {
  @ApiProperty({ example: '2026-11-03', description: 'Data (YYYY-MM-DD)' })
  @IsDataReal()
  data!: string;

  @ApiProperty({ example: 20, description: 'Id do exame (define a duração)' })
  @Type(() => Number)
  @IsInt({ message: 'exameId deve ser um número inteiro' })
  @IsPositive({ message: 'exameId deve ser positivo' })
  exameId!: number;
}
