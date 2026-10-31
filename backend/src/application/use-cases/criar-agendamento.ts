import type { Agendamento } from '../../domain/agendamento';
import { RegraNegocioError } from '../../domain/erros';
import { gerarHorarios } from '../../domain/gerar-horarios';
import { turnosDoDia } from '../../domain/medico';
import type { AgendamentosRepository } from '../ports/agendamentos.repository';
import type { Clock } from '../ports/clock';
import type { ExamesRepository } from '../ports/exames.repository';
import type { MedicosRepository } from '../ports/medicos.repository';
import { obterExame, obterMedico } from './catalogo';

export interface CriarAgendamentoEntrada {
  pacienteNome: string;
  exameId: number;
  medicoId: number;
  inicio: string; // YYYY-MM-DDTHH:mm
}

export class CriarAgendamento {
  constructor(
    private readonly medicos: MedicosRepository,
    private readonly exames: ExamesRepository,
    private readonly agendamentos: AgendamentosRepository,
    private readonly clock: Clock,
  ) {}

  executar(entrada: CriarAgendamentoEntrada): Agendamento {
    const exame = obterExame(this.exames, entrada.exameId);
    const medico = obterMedico(this.medicos, entrada.medicoId);

    if (entrada.inicio <= this.clock.agoraLocal()) {
      throw new RegraNegocioError(
        'Não é possível agendar em data e hora que já passaram',
      );
    }

    // PR2: o início precisa ser um dos horários da grade do médico (turnos, sem agendamentos).
    const data = entrada.inicio.slice(0, 10);
    const hora = entrada.inicio.slice(11);
    const horario = gerarHorarios(
      turnosDoDia(medico, data),
      exame.duracaoMinutos,
      [],
    ).find((h) => h.inicio === hora);
    if (!horario) {
      throw new RegraNegocioError(
        'Horário fora do expediente ou fora da grade do médico para este exame',
      );
    }

    return this.agendamentos.inserirSeLivre({
      pacienteNome: entrada.pacienteNome,
      exameId: exame.id,
      medicoId: medico.id,
      inicio: entrada.inicio,
      fim: `${data}T${horario.fim}`,
    });
  }
}
