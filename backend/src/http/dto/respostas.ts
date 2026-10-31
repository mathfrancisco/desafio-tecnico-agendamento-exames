// Formas de resposta, só para documentar o contrato no Swagger.
import { ApiProperty } from '@nestjs/swagger';

export class ExameResposta {
  @ApiProperty({ example: 20 })
  id!: number;

  @ApiProperty({ example: 'Ressonância Magnética de Crânio' })
  nome!: string;

  @ApiProperty({ example: 40, description: 'Duração em minutos' })
  duracaoMinutos!: number;
}

export class TurnoResposta {
  @ApiProperty({
    example: 'SEG',
    enum: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'],
  })
  dia!: string;

  @ApiProperty({ example: '08:00' })
  inicio!: string;

  @ApiProperty({ example: '12:00' })
  fim!: string;
}

export class MedicoResposta {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Dra. Helena Marques' })
  nome!: string;

  @ApiProperty({ example: 'CRM-MG 11111' })
  crm!: string;

  @ApiProperty({ type: [TurnoResposta] })
  turnos!: TurnoResposta[];
}

export class IntervaloResposta {
  @ApiProperty({ example: '08:00' })
  inicio!: string;

  @ApiProperty({ example: '08:40' })
  fim!: string;
}

export class HorariosResposta {
  @ApiProperty({ example: 1 })
  medicoId!: number;

  @ApiProperty({ example: 20 })
  exameId!: number;

  @ApiProperty({ example: '2026-11-03' })
  data!: string;

  @ApiProperty({ type: [IntervaloResposta] })
  horarios!: IntervaloResposta[];
}

export class DiaDisponibilidadeResposta {
  @ApiProperty({ example: '2026-11-03' })
  data!: string;

  @ApiProperty({ example: 12, description: 'Horários livres naquele dia' })
  livres!: number;
}

export class DisponibilidadeResposta {
  @ApiProperty({ example: 1 })
  medicoId!: number;

  @ApiProperty({ example: 20 })
  exameId!: number;

  @ApiProperty({ example: '2026-11' })
  mes!: string;

  @ApiProperty({
    type: [DiaDisponibilidadeResposta],
    description: 'Todos os dias do mês, em ordem',
  })
  dias!: DiaDisponibilidadeResposta[];
}

export class AgendamentoResposta {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Maria Silva' })
  pacienteNome!: string;

  @ApiProperty({ example: 20 })
  exameId!: number;

  @ApiProperty({ example: 1 })
  medicoId!: number;

  @ApiProperty({ example: '2026-11-03T08:00' })
  inicio!: string;

  @ApiProperty({
    example: '2026-11-03T08:40',
    description: 'inicio + duração do exame',
  })
  fim!: string;

  @ApiProperty({ example: '2026-10-31T15:00:00.000Z', description: 'UTC' })
  criadoEm!: string;
}

export class ErroResposta {
  @ApiProperty({ example: 409 })
  statusCode!: number;

  @ApiProperty({ example: 'Conflict' })
  error!: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Horário indisponível para este médico',
    description: 'Texto do erro; em 400 pode ser a lista de campos inválidos',
  })
  message!: string | string[];
}
