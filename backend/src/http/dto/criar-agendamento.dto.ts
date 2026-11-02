import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsPositive, IsString, Length, Matches } from 'class-validator';
import { IsDataHoraReal } from './validadores';

export class CriarAgendamentoDto {
  @ApiProperty({
    example: 'Maria Silva',
    minLength: 3,
    maxLength: 100,
    description:
      'Nome do paciente, sem espaços nas pontas nem caracteres de controle (quebra de linha, tab)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'pacienteNome deve ser um texto' })
  @Length(3, 100, {
    message: 'pacienteNome deve ter entre 3 e 100 caracteres',
  })
  @Matches(/^\P{Cc}*$/u, {
    message:
      'pacienteNome não pode ter quebra de linha nem caracteres de controle',
  })
  pacienteNome!: string;

  @ApiProperty({ example: 20, description: 'Id do exame (define a duração)' })
  @IsInt({ message: 'exameId deve ser um número inteiro' })
  @IsPositive({ message: 'exameId deve ser positivo' })
  exameId!: number;

  @ApiProperty({ example: 1, description: 'Id do médico' })
  @IsInt({ message: 'medicoId deve ser um número inteiro' })
  @IsPositive({ message: 'medicoId deve ser positivo' })
  medicoId!: number;

  @ApiProperty({
    example: '2027-03-02T08:00',
    description:
      'Início na hora local da clínica (America/Sao_Paulo); precisa ser um horário da grade do médico',
  })
  @IsDataHoraReal()
  inicio!: string;
}
