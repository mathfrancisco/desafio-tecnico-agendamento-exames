import { NaoEncontradoError } from '../../domain/erros';
import {
  AgendamentosFake,
  ExamesFake,
  MedicosFake,
  relogioFixo,
} from '../testing/fakes';
import { ConsultarDisponibilidade } from './consultar-disponibilidade';
import { ConsultarHorarios } from './consultar-horarios';

// Segunda-feira 2026-11-02, 10:00. Helena (1) atende de segunda a sexta; exame 20 dura 40 min.
const AGORA = '2026-11-02T10:00';
const EXAME = 20;

describe('ConsultarDisponibilidade', () => {
  let agendamentos: AgendamentosFake;
  let consultar: ConsultarDisponibilidade;

  beforeEach(() => {
    agendamentos = new AgendamentosFake();
    consultar = new ConsultarDisponibilidade(
      new MedicosFake(),
      new ExamesFake(),
      agendamentos,
      relogioFixo(AGORA),
    );
  });

  const livres = (mes: string, medicoId = 1) => {
    const { dias } = consultar.executar(medicoId, EXAME, mes);
    return Object.fromEntries(dias.map((d) => [d.data, d.livres]));
  };
  const reservar = (inicio: string, fim: string, medicoId = 1) =>
    agendamentos.inserirSeLivre({
      pacienteNome: 'Maria Silva',
      exameId: EXAME,
      medicoId,
      inicio,
      fim,
    });

  it('devolve todos os dias do mês em ordem', () => {
    const resposta = consultar.executar(1, EXAME, '2026-11');
    expect(resposta).toMatchObject({
      medicoId: 1,
      exameId: EXAME,
      mes: '2026-11',
    });
    expect(resposta.dias).toHaveLength(30);
    expect(resposta.dias[0].data).toBe('2026-11-01');
    expect(resposta.dias[29].data).toBe('2026-11-30');
  });

  it('dia sem turno ou passado tem 0; dia futuro com turno tem a grade completa', () => {
    const dias = livres('2026-11');
    expect(dias['2026-11-01']).toBe(0); // domingo e passado
    expect(dias['2026-11-07']).toBe(0); // sábado, sem turno
    expect(dias['2026-11-03']).toBe(12); // terça: 6 + 6 horários de 40 min
  });

  it('hoje conta só o que ainda não começou', () => {
    expect(livres('2026-11')['2026-11-02']).toBe(8);
  });

  it('mês inteiro no passado devolve só zeros', () => {
    expect(Object.values(livres('2026-10')).every((n) => n === 0)).toBe(true);
  });

  it('agendamento reduz o total do dia, e os demais dias não mudam', () => {
    reservar('2026-11-03T09:20', '2026-11-03T10:00');
    const dias = livres('2026-11');
    expect(dias['2026-11-03']).toBe(11);
    expect(dias['2026-11-04']).toBe(12);
  });

  it('agendamento de outro médico não afeta o total', () => {
    reservar('2026-11-03T14:00', '2026-11-03T14:40', 2);
    expect(livres('2026-11')['2026-11-03']).toBe(12);
  });

  it('bate com ConsultarHorarios em todos os dias do mês', () => {
    reservar('2026-11-03T09:20', '2026-11-03T10:00');
    reservar('2026-11-10T14:00', '2026-11-10T14:40');
    const horarios = new ConsultarHorarios(
      new MedicosFake(),
      new ExamesFake(),
      agendamentos,
      relogioFixo(AGORA),
    );
    for (const { data, livres: n } of consultar.executar(1, EXAME, '2026-11')
      .dias) {
      expect(n).toBe(horarios.executar(1, EXAME, data).horarios.length);
    }
  });

  it('consulta o repositório uma única vez para o mês inteiro', () => {
    const listar = jest.spyOn(agendamentos, 'listarPorPeriodo');
    consultar.executar(1, EXAME, '2026-11');
    expect(listar).toHaveBeenCalledTimes(1);
    expect(listar).toHaveBeenCalledWith(1, '2026-11-01', '2026-11-30');
  });

  it('lança NaoEncontradoError para médico ou exame inexistente', () => {
    expect(() => consultar.executar(99, EXAME, '2026-11')).toThrow(
      NaoEncontradoError,
    );
    expect(() => consultar.executar(1, 999, '2026-11')).toThrow(
      NaoEncontradoError,
    );
  });
});
