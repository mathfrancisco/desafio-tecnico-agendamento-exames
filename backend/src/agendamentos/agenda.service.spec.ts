import { criarBanco } from '../database/database.module';
import { ExamesRepository } from '../exames/exames.repository';
import { ExamesService } from '../exames/exames.service';
import { MedicosRepository } from '../medicos/medicos.repository';
import { MedicosService } from '../medicos/medicos.service';
import { NaoEncontradoError } from '../shared/erros';
import { AgendaService } from './agenda.service';
import { AgendamentosRepository } from './agendamentos.repository';

// Segunda-feira, 10:00. 2026-11-03 é terça; 2026-11-01 é domingo.
const AGORA = '2026-11-02T10:00';
const EXAME_40_MIN = 20;

describe('AgendaService', () => {
  let agendamentos: AgendamentosRepository;
  let service: AgendaService;

  beforeEach(() => {
    agendamentos = new AgendamentosRepository(criarBanco(':memory:'));
    service = new AgendaService(
      new MedicosService(new MedicosRepository()),
      new ExamesService(new ExamesRepository()),
      agendamentos,
      { agoraLocal: () => AGORA },
    );
  });

  const inicios = (medicoId: number, data: string) =>
    service
      .horariosLivres(medicoId, EXAME_40_MIN, data)
      .horarios.map((h) => h.inicio);

  it('devolve os horários dos dois turnos de um dia futuro', () => {
    const resposta = service.horariosLivres(1, EXAME_40_MIN, '2026-11-03');
    expect(resposta).toMatchObject({
      medicoId: 1,
      exameId: EXAME_40_MIN,
      data: '2026-11-03',
    });
    expect(resposta.horarios).toHaveLength(12);
    expect(resposta.horarios[0]).toEqual({ inicio: '08:00', fim: '08:40' });
  });

  it('remove horários de hoje que já passaram, inclusive o que começa agora', () => {
    expect(inicios(1, '2026-11-02')).toEqual([
      '10:40',
      '11:20',
      '14:00',
      '14:40',
      '15:20',
      '16:00',
      '16:40',
      '17:20',
    ]);
  });

  it('data passada devolve lista vazia', () => {
    expect(inicios(1, '2026-11-01')).toEqual([]);
    expect(inicios(1, '2026-10-30')).toEqual([]);
  });

  it('dia sem turno devolve lista vazia', () => {
    // Helena não atende no sábado (2026-11-07).
    expect(inicios(1, '2026-11-07')).toEqual([]);
  });

  it('remove o horário já agendado e mantém os demais', () => {
    agendamentos.inserirSeLivre({
      pacienteNome: 'Maria Silva',
      exameId: EXAME_40_MIN,
      medicoId: 1,
      inicio: '2026-11-03T09:20',
      fim: '2026-11-03T10:00',
    });
    const livres = inicios(1, '2026-11-03');
    expect(livres).not.toContain('09:20');
    expect(livres).toContain('08:40');
    expect(livres).toContain('10:00');
    expect(livres).toHaveLength(11);
  });

  it('agendamentos de outro médico não afetam a agenda', () => {
    agendamentos.inserirSeLivre({
      pacienteNome: 'Maria Silva',
      exameId: EXAME_40_MIN,
      medicoId: 2,
      inicio: '2026-11-03T14:00',
      fim: '2026-11-03T14:40',
    });
    expect(inicios(1, '2026-11-03')).toContain('14:00');
  });

  it('lança NaoEncontradoError para médico ou exame inexistente', () => {
    expect(() =>
      service.horariosLivres(99, EXAME_40_MIN, '2026-11-03'),
    ).toThrow(NaoEncontradoError);
    expect(() => service.horariosLivres(1, 999, '2026-11-03')).toThrow(
      NaoEncontradoError,
    );
  });
});
