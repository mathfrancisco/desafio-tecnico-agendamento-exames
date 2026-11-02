import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { IsMes } from './validadores';

export class DisponibilidadeQuery {
  @ApiProperty({ example: '2027-03', description: 'Mês (YYYY-MM)' })
  @IsMes()
  mes!: string;

  @ApiProperty({ example: 20, description: 'Id do exame (define a duração)' })
  @Type(() => Number)
  @IsInt({ message: 'exameId deve ser um número inteiro' })
  @IsPositive({ message: 'exameId deve ser positivo' })
  exameId!: number;
}
