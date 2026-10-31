import { DiaSemana, diaDaSemana } from './tempo';

export interface Turno {
  dia: DiaSemana;
  inicio: string; // HH:MM
  fim: string; // HH:MM
}

export interface Medico {
  id: number;
  nome: string;
  crm: string;
  turnos: Turno[];
}

/** Turnos do médico no dia da semana de `data` (YYYY-MM-DD). */
export function turnosDoDia(medico: Medico, data: string): Turno[] {
  const dia = diaDaSemana(data);
  return medico.turnos.filter((turno) => turno.dia === dia);
}
