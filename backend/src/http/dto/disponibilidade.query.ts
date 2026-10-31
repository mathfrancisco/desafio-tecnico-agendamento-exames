import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { IsMes } from './validadores';

export class DisponibilidadeQuery {
  @IsMes()
  mes!: string;

  @Type(() => Number)
  @IsInt({ message: 'exameId deve ser um número inteiro' })
  @IsPositive({ message: 'exameId deve ser positivo' })
  exameId!: number;
}
