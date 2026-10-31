import { NaoEncontradoError, RegraNegocioError } from '../../domain/erros';
import { AgendamentosFake, relogioFixo } from '../testing/fakes';
import { CancelarAgendamento } from './cancelar-agendamento';

// Segunda-feira, 10:00.
const AGORA = '2026-11-02T10:00';

describe('CancelarAgendamento', () => {
  let agendamentos: AgendamentosFake;
  let cancelar: CancelarAgendamento;

  const reservar = (inicio: string, fim: string) =>
    agendamentos.inserirSeLivre({
      pacienteNome: 'Maria Silva',
      exameId: 20,
      medicoId: 1,
      inicio,
      fim,
    });

  beforeEach(() => {
    agendamentos = new AgendamentosFake();
    cancelar = new CancelarAgendamento(agendamentos, relogioFixo(AGORA));
  });

  it('remove o agendamento futuro e libera o horário', () => {
    const { id } = reservar('2026-11-03T08:00', '2026-11-03T08:40');
    cancelar.executar(id);
    expect(agendamentos.obter(id)).toBeUndefined();
    expect(() =>
      reservar('2026-11-03T08:00', '2026-11-03T08:40'),
    ).not.toThrow();
  });

  it('aceita cancelar um agendamento de hoje que ainda não começou', () => {
    const { id } = reservar('2026-11-02T10:01', '2026-11-02T10:41');
    cancelar.executar(id);
    expect(agendamentos.obter(id)).toBeUndefined();
  });

  it('404 para agendamento inexistente', () => {
    expect(() => cancelar.executar(999)).toThrow(NaoEncontradoError);
  });

  it.each([
    ['já terminou', '2026-11-02T08:00', '2026-11-02T08:40'],
    ['em andamento', '2026-11-02T09:40', '2026-11-02T10:20'],
    ['começa exatamente agora', AGORA, '2026-11-02T10:40'],
    ['de um dia anterior', '2026-10-30T08:00', '2026-10-30T08:40'],
  ])('422 quando o agendamento %s, sem remover', (_caso, inicio, fim) => {
    const { id } = reservar(inicio, fim);
    expect(() => cancelar.executar(id)).toThrow(RegraNegocioError);
    expect(agendamentos.obter(id)).toBeDefined();
  });
});
