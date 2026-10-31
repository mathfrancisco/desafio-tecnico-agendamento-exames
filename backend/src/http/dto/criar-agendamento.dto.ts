import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsPositive, IsString, Length } from 'class-validator';
import { IsDataHoraReal } from './validadores';

export class CriarAgendamentoDto {
  @ApiProperty({
    example: 'Maria Silva',
    minLength: 3,
    maxLength: 100,
    description: 'Nome do paciente, sem espaços nas pontas',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'pacienteNome deve ser um texto' })
  @Length(3, 100, {
    message: 'pacienteNome deve ter entre 3 e 100 caracteres',
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
    example: '2026-11-03T08:00',
    description:
      'Início na hora local da clínica (America/Sao_Paulo); precisa ser um horário da grade do médico',
  })
  @IsDataHoraReal()
  inicio!: string;
}
