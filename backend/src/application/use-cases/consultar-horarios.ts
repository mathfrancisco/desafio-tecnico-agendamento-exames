import { horariosLivresDoDia, Intervalo } from '../../domain/gerar-horarios';
import type { AgendamentosRepository } from '../ports/agendamentos.repository';
import type { Clock } from '../ports/clock';
import type { ExamesRepository } from '../ports/exames.repository';
import type { MedicosRepository } from '../ports/medicos.repository';
import { obterExame, obterMedico } from './catalogo';

export interface HorariosLivres {
  medicoId: number;
  exameId: number;
  data: string;
  horarios: Intervalo[];
}

export class ConsultarHorarios {
  constructor(
    private readonly medicos: MedicosRepository,
    private readonly exames: ExamesRepository,
    private readonly agendamentos: AgendamentosRepository,
    private readonly clock: Clock,
  ) {}

  executar(medicoId: number, exameId: number, data: string): HorariosLivres {
    const medico = obterMedico(this.medicos, medicoId);
    const exame = obterExame(this.exames, exameId);
    const doDia = this.agendamentos.listarPorPeriodo(medicoId, data, data);
    const horarios = horariosLivresDoDia(
      medico,
      data,
      exame.duracaoMinutos,
      doDia,
      this.clock.agoraLocal(),
    );
    return { medicoId, exameId, data, horarios };
  }
}
