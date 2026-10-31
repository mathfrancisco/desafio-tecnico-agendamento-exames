import type { Medico, Turno } from '../../domain/medico';
import type { DiaSemana } from '../../domain/tempo';

const ORDEM_DIAS: DiaSemana[] = [
  'SEG',
  'TER',
  'QUA',
  'QUI',
  'SEX',
  'SAB',
  'DOM',
];

/** Aplica as mesmas faixas de horário a vários dias; o resultado sai ordenado por dia e início. */
function turnos(dias: DiaSemana[], faixas: [string, string][]): Turno[] {
  return dias.flatMap((dia) =>
    faixas.map(([inicio, fim]): Turno => ({ dia, inicio, fim })),
  );
}

function ordenar(lista: Turno[]): Turno[] {
  return lista.sort(
    (a, b) =>
      ORDEM_DIAS.indexOf(a.dia) - ORDEM_DIAS.indexOf(b.dia) ||
      a.inicio.localeCompare(b.inicio),
  );
}

const SEG_A_SEX: DiaSemana[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];

// Fonte: dados/medicos.md
export const MEDICOS: Medico[] = [
  {
    id: 1,
    nome: 'Dra. Helena Marques',
    crm: 'CRM-MG 11111',
    turnos: ordenar(
      turnos(SEG_A_SEX, [
        ['08:00', '12:00'],
        ['14:00', '18:00'],
      ]),
    ),
  },
  {
    id: 2,
    nome: 'Dr. Rafael Teixeira',
    crm: 'CRM-MG 22222',
    turnos: ordenar([
      ...turnos(['SEG', 'QUA', 'SEX'], [['07:00', '13:00']]),
      ...turnos(['TER', 'QUI'], [['13:00', '19:00']]),
    ]),
  },
  {
    id: 3,
    nome: 'Dra. Beatriz Nogueira',
    crm: 'CRM-MG 33333',
    turnos: ordenar(
      turnos(
        ['SEG', 'TER', 'QUA', 'QUI'],
        [
          ['09:00', '12:00'],
          ['18:00', '22:00'],
        ],
      ),
    ),
  },
  {
    id: 4,
    nome: 'Dr. Thiago Fontes',
    crm: 'CRM-MG 44444',
    turnos: ordenar([
      ...turnos(['TER', 'QUA', 'QUI', 'SEX', 'SAB'], [['08:00', '12:00']]),
      ...turnos(['QUA', 'SEX'], [['19:00', '22:00']]),
    ]),
  },
  {
    id: 5,
    nome: 'Dra. Camila Andrade',
    crm: 'CRM-MG 55555',
    turnos: ordenar([
      ...turnos(SEG_A_SEX, [['10:00', '14:00']]),
      ...turnos(['SAB'], [['08:00', '12:00']]),
    ]),
  },
];
