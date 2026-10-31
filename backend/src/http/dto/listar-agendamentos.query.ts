import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { IsMes } from './validadores';

export class ListarAgendamentosQuery {
  @IsMes()
  mes!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'medicoId deve ser um número inteiro' })
  @IsPositive({ message: 'medicoId deve ser positivo' })
  medicoId?: number;
}
