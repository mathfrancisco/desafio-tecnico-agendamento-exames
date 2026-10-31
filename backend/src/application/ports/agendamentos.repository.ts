import type { Agendamento, NovoAgendamento } from '../../domain/agendamento';

export const AGENDAMENTOS_REPOSITORY = Symbol('AGENDAMENTOS_REPOSITORY');

export interface AgendamentosRepository {
  /** Checa sobreposição e insere de forma atômica; lança ConflitoError se o horário estiver ocupado. */
  inserirSeLivre(novo: NovoAgendamento): Agendamento;
  /**
   * Agendamentos com início entre as datas `desde` e `ate` (YYYY-MM-DD, ambas
   * inclusivas), em ordem de início. Sem `medicoId`, traz todos os médicos.
   */
  listarPorPeriodo(
    medicoId: number | undefined,
    desde: string,
    ate: string,
  ): Agendamento[];
}
