import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { IsDataReal } from './validadores';

export class HorariosQuery {
  @IsDataReal()
  data!: string;

  @Type(() => Number)
  @IsInt({ message: 'exameId deve ser um número inteiro' })
  @IsPositive({ message: 'exameId deve ser positivo' })
  exameId!: number;
}
