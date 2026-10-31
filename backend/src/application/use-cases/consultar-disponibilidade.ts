import { horariosLivresDoDia } from '../../domain/gerar-horarios';
import { diasDoMes } from '../../domain/tempo';
import type { AgendamentosRepository } from '../ports/agendamentos.repository';
import type { Clock } from '../ports/clock';
import type { ExamesRepository } from '../ports/exames.repository';
import type { MedicosRepository } from '../ports/medicos.repository';
import { obterExame, obterMedico } from './catalogo';

export interface Disponibilidade {
  medicoId: number;
  exameId: number;
  mes: string;
  dias: { data: string; livres: number }[];
}

export class ConsultarDisponibilidade {
  constructor(
    private readonly medicos: MedicosRepository,
    private readonly exames: ExamesRepository,
    private readonly agendamentos: AgendamentosRepository,
    private readonly clock: Clock,
  ) {}

  /** RN8: por dia do mês, quantos horários `ConsultarHorarios` devolveria. */
  executar(medicoId: number, exameId: number, mes: string): Disponibilidade {
    const medico = obterMedico(this.medicos, medicoId);
    const exame = obterExame(this.exames, exameId);
    const datas = diasDoMes(mes);

    // Uma consulta para o mês inteiro; depois agrupa por data.
    const porData = new Map<string, { inicio: string; fim: string }[]>();
    for (const a of this.agendamentos.listarPorPeriodo(
      medicoId,
      datas[0],
      datas[datas.length - 1],
    )) {
      const data = a.inicio.slice(0, 10);
      porData.set(data, [...(porData.get(data) ?? []), a]);
    }

    const agora = this.clock.agoraLocal();
    const dias = datas.map((data) => ({
      data,
      livres: horariosLivresDoDia(
        medico,
        data,
        exame.duracaoMinutos,
        porData.get(data) ?? [],
        agora,
      ).length,
    }));
    return { medicoId, exameId, mes, dias };
  }
}
