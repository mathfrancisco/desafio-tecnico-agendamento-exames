import type { Agendamento } from '../../domain/agendamento';
import { diasDoMes } from '../../domain/tempo';
import type { AgendamentosRepository } from '../ports/agendamentos.repository';
import type { MedicosRepository } from '../ports/medicos.repository';
import { obterMedico } from './catalogo';

export class ListarAgendamentos {
  constructor(
    private readonly medicos: MedicosRepository,
    private readonly agendamentos: AgendamentosRepository,
  ) {}

  /** Agendamentos do mês (YYYY-MM) por início; `medicoId` opcional filtra por médico. */
  executar(mes: string, medicoId?: number): Agendamento[] {
    if (medicoId !== undefined) obterMedico(this.medicos, medicoId);
    const datas = diasDoMes(mes);
    return this.agendamentos.listarPorPeriodo(
      medicoId,
      datas[0],
      datas[datas.length - 1],
    );
  }
}
