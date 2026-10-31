import { NaoEncontradoError } from '../../domain/erros';
import { AgendamentosFake, MedicosFake } from '../testing/fakes';
import { ListarAgendamentos } from './listar-agendamentos';

describe('ListarAgendamentos', () => {
  let agendamentos: AgendamentosFake;
  let listar: ListarAgendamentos;

  const reservar = (medicoId: number, dia: string, hora: string) =>
    agendamentos.inserirSeLivre({
      pacienteNome: 'Maria Silva',
      exameId: 20,
      medicoId,
      inicio: `${dia}T${hora}`,
      fim: `${dia}T${hora.slice(0, 2)}:59`,
    });
  const inicios = (mes: string, medicoId?: number) =>
    listar.executar(mes, medicoId).map((a) => a.inicio);

  beforeEach(() => {
    agendamentos = new AgendamentosFake();
    listar = new ListarAgendamentos(new MedicosFake(), agendamentos);
    reservar(1, '2026-11-10', '14:00');
    reservar(2, '2026-11-03', '15:00');
    reservar(1, '2026-11-03', '08:00');
    reservar(1, '2026-10-31', '08:00');
    reservar(1, '2026-12-01', '08:00');
  });

  it('devolve só os agendamentos do mês, ordenados por início', () => {
    expect(inicios('2026-11')).toEqual([
      '2026-11-03T08:00',
      '2026-11-03T15:00',
      '2026-11-10T14:00',
    ]);
  });

  it('filtra por médico', () => {
    expect(inicios('2026-11', 1)).toEqual([
      '2026-11-03T08:00',
      '2026-11-10T14:00',
    ]);
    expect(inicios('2026-11', 2)).toEqual(['2026-11-03T15:00']);
  });

  it('mês sem agendamentos devolve lista vazia', () => {
    expect(inicios('2027-01')).toEqual([]);
  });

  it('médico inexistente no filtro lança NaoEncontradoError', () => {
    expect(() => listar.executar('2026-11', 99)).toThrow(NaoEncontradoError);
  });
});
