// Ports falsos em memória para testar use cases sem Nest nem banco.
import type { Agendamento, NovoAgendamento } from '../../domain/agendamento';
import { ConflitoError } from '../../domain/erros';
import type { Exame } from '../../domain/exame';
import type { Medico, Turno } from '../../domain/medico';
import type { DiaSemana } from '../../domain/tempo';
import type { AgendamentosRepository } from '../ports/agendamentos.repository';
import type { Clock } from '../ports/clock';
import type { ExamesRepository } from '../ports/exames.repository';
import type { MedicosRepository } from '../ports/medicos.repository';

export const EXAMES: Exame[] = [
  { id: 4, nome: 'Raio-X de Joelho', duracaoMinutos: 20 },
  { id: 6, nome: 'Mamografia Bilateral', duracaoMinutos: 30 },
  { id: 20, nome: 'Ressonância Magnética de Crânio', duracaoMinutos: 40 },
  { id: 21, nome: 'Ressonância Magnética de Joelho', duracaoMinutos: 40 },
];

const turnos = (dias: DiaSemana[], faixas: [string, string][]): Turno[] =>
  dias.flatMap((dia) => faixas.map(([inicio, fim]) => ({ dia, inicio, fim })));

export const MEDICOS: Medico[] = [
  {
    id: 1,
    nome: 'Dra. Helena Marques',
    crm: 'CRM-MG 11111',
    turnos: turnos(
      ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      [
        ['08:00', '12:00'],
        ['14:00', '18:00'],
      ],
    ),
  },
  {
    id: 2,
    nome: 'Dr. Rafael Teixeira',
    crm: 'CRM-MG 22222',
    turnos: turnos(['TER', 'QUI'], [['13:00', '19:00']]),
  },
];

export class ExamesFake implements ExamesRepository {
  constructor(private readonly exames: Exame[] = EXAMES) {}

  listar(): Exame[] {
    return [...this.exames];
  }

  buscarPorId(id: number): Exame | undefined {
    return this.exames.find((e) => e.id === id);
  }
}

export class MedicosFake implements MedicosRepository {
  constructor(private readonly medicos: Medico[] = MEDICOS) {}

  listar(): Medico[] {
    return [...this.medicos];
  }

  buscarPorId(id: number): Medico | undefined {
    return this.medicos.find((m) => m.id === id);
  }
}

export class AgendamentosFake implements AgendamentosRepository {
  private readonly itens: Agendamento[] = [];

  inserirSeLivre(novo: NovoAgendamento): Agendamento {
    const cruza = this.itens.some(
      (a) =>
        a.medicoId === novo.medicoId &&
        a.inicio < novo.fim &&
        a.fim > novo.inicio,
    );
    if (cruza) throw new ConflitoError('Horário indisponível para este médico');
    const criado = {
      id: this.itens.length + 1,
      ...novo,
      criadoEm: '2026-11-02T13:00:00.000Z',
    };
    this.itens.push(criado);
    return criado;
  }

  listarPorPeriodo(
    medicoId: number | undefined,
    desde: string,
    ate: string,
  ): Agendamento[] {
    return this.itens
      .filter(
        (a) =>
          (medicoId === undefined || a.medicoId === medicoId) &&
          a.inicio >= `${desde}T00:00` &&
          a.inicio <= `${ate}T23:59`,
      )
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  }
}

export const relogioFixo = (agora: string): Clock => ({
  agoraLocal: () => agora,
});
