import { Transform } from 'class-transformer';
import { IsInt, IsPositive, IsString, Length } from 'class-validator';
import { IsDataHoraReal } from './validadores';

export class CriarAgendamentoDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'pacienteNome deve ser um texto' })
  @Length(3, 100, {
    message: 'pacienteNome deve ter entre 3 e 100 caracteres',
  })
  pacienteNome!: string;

  @IsInt({ message: 'exameId deve ser um número inteiro' })
  @IsPositive({ message: 'exameId deve ser positivo' })
  exameId!: number;

  @IsInt({ message: 'medicoId deve ser um número inteiro' })
  @IsPositive({ message: 'medicoId deve ser positivo' })
  medicoId!: number;

  @IsDataHoraReal()
  inicio!: string;
}
