import { NaoEncontradoError, RegraNegocioError } from '../../domain/erros';
import type { AgendamentosRepository } from '../ports/agendamentos.repository';
import type { Clock } from '../ports/clock';

export class CancelarAgendamento {
  constructor(
    private readonly agendamentos: AgendamentosRepository,
    private readonly clock: Clock,
  ) {}

  /** RN7: só antes do início; PR9: cancelar apaga o registro. */
  executar(id: number): void {
    const agendamento = this.agendamentos.obter(id);
    if (!agendamento) {
      throw new NaoEncontradoError(`Agendamento ${id} não encontrado`);
    }
    if (agendamento.inicio <= this.clock.agoraLocal()) {
      throw new RegraNegocioError(
        'Não é possível cancelar um agendamento que já começou',
      );
    }
    this.agendamentos.remover(id);
  }
}
