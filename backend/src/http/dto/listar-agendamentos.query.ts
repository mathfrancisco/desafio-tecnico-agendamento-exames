import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { IsMes } from './validadores';

export class ListarAgendamentosQuery {
  @ApiProperty({ example: '2027-03', description: 'Mês (YYYY-MM)' })
  @IsMes()
  mes!: string;

  @ApiPropertyOptional({ example: 1, description: 'Filtra por médico' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'medicoId deve ser um número inteiro' })
  @IsPositive({ message: 'medicoId deve ser positivo' })
  medicoId?: number;
}
