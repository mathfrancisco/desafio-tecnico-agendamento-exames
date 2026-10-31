import { criarBanco } from '../database/database.module';
import { ExamesRepository } from '../exames/exames.repository';
import { ExamesService } from '../exames/exames.service';
import { MedicosRepository } from '../medicos/medicos.repository';
import { MedicosService } from '../medicos/medicos.service';
import {
  ConflitoError,
  NaoEncontradoError,
  RegraNegocioError,
} from '../shared/erros';
import { AgendamentosRepository } from './agendamentos.repository';
import { AgendamentosService } from './agendamentos.service';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';

// Segunda-feira, 10:00. Exame 20 dura 40 min; exame 6, 30 min.
const AGORA = '2026-11-02T10:00';

const dto = (
  parcial: Partial<CriarAgendamentoDto> = {},
): CriarAgendamentoDto => ({
  pacienteNome: 'Maria Silva',
  exameId: 20,
  medicoId: 1,
  inicio: '2026-11-03T08:00',
  ...parcial,
});

describe('AgendamentosService', () => {
  let service: AgendamentosService;

  beforeEach(() => {
    service = new AgendamentosService(
      new MedicosService(new MedicosRepository()),
      new ExamesService(new ExamesRepository()),
      new AgendamentosRepository(criarBanco(':memory:')),
      { agoraLocal: () => AGORA },
    );
  });

  it('cria o agendamento com fim derivado da duração do exame', () => {
    expect(service.criar(dto())).toMatchObject({
      id: 1,
      pacienteNome: 'Maria Silva',
      exameId: 20,
      medicoId: 1,
      inicio: '2026-11-03T08:00',
      fim: '2026-11-03T08:40',
    });
  });

  it('usa a duração do exame escolhido (30 min)', () => {
    expect(service.criar(dto({ exameId: 6 })).fim).toBe('2026-11-03T08:30');
  });

  it('aceita horário do segundo turno', () => {
    expect(service.criar(dto({ inicio: '2026-11-03T14:40' })).fim).toBe(
      '2026-11-03T15:20',
    );
  });

  it('404 para exame inexistente', () => {
    expect(() => service.criar(dto({ exameId: 999 }))).toThrow(
      NaoEncontradoError,
    );
  });

  it('404 para médico inexistente', () => {
    expect(() => service.criar(dto({ medicoId: 99 }))).toThrow(
      NaoEncontradoError,
    );
  });

  it('422 para início no passado ou exatamente agora', () => {
    expect(() => service.criar(dto({ inicio: '2026-11-02T09:20' }))).toThrow(
      RegraNegocioError,
    );
    expect(() => service.criar(dto({ inicio: AGORA }))).toThrow(/já passaram/);
  });

  it('aceita horário de hoje que ainda não começou', () => {
    // Helena, 10:40 está na grade de 40 min a partir das 08:00.
    expect(service.criar(dto({ inicio: '2026-11-02T10:40' })).fim).toBe(
      '2026-11-02T11:20',
    );
  });

  it('422 para dia sem expediente', () => {
    // 2026-11-07 é sábado e Helena não atende.
    expect(() => service.criar(dto({ inicio: '2026-11-07T08:00' }))).toThrow(
      RegraNegocioError,
    );
  });

  it('422 para horário fora do turno', () => {
    expect(() => service.criar(dto({ inicio: '2026-11-03T12:40' }))).toThrow(
      RegraNegocioError,
    );
  });

  it('422 para horário fora da grade do exame', () => {
    expect(() => service.criar(dto({ inicio: '2026-11-03T08:30' }))).toThrow(
      /grade/,
    );
  });

  it('422 quando o exame estouraria o fim do turno', () => {
    // 11:40 + 40 min termina 12:20, depois do turno que acaba 12:00.
    expect(() => service.criar(dto({ inicio: '2026-11-03T11:40' }))).toThrow(
      RegraNegocioError,
    );
  });

  it('409 quando o horário já está ocupado', () => {
    service.criar(dto());
    expect(() => service.criar(dto({ pacienteNome: 'João Souza' }))).toThrow(
      ConflitoError,
    );
  });

  it('409 quando outro exame, de outra duração, cruza o horário existente', () => {
    service.criar(dto({ exameId: 6, inicio: '2026-11-03T09:00' })); // 09:00–09:30
    expect(() => service.criar(dto({ inicio: '2026-11-03T08:40' }))).toThrow(
      ConflitoError, // 08:40–09:20
    );
  });
});
