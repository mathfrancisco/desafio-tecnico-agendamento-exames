export type DiaSemana = 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB' | 'DOM'

export interface Exame {
  id: number
  nome: string
  duracaoMinutos: number
}

export interface Turno {
  dia: DiaSemana
  inicio: string
  fim: string
}

export interface Medico {
  id: number
  nome: string
  crm: string
  turnos: Turno[]
}

export interface Horario {
  inicio: string
  fim: string
}

export interface HorariosDoDia {
  medicoId: number
  exameId: number
  data: string
  horarios: Horario[]
}

export interface NovoAgendamento {
  pacienteNome: string
  exameId: number
  medicoId: number
  inicio: string
}

export interface Agendamento extends NovoAgendamento {
  id: number
  fim: string
  criadoEm: string
}
