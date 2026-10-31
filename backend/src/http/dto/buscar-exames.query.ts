import { IsOptional, IsString } from 'class-validator';

export class BuscarExamesQuery {
  @IsOptional()
  @IsString({ message: 'nome deve ser um texto' })
  nome?: string;
}
