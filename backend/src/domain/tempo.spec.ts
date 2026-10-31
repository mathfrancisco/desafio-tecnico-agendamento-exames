import {
  deMinutos,
  diaDaSemana,
  ehDataHoraReal,
  ehDataReal,
  paraMinutos,
} from './tempo';

describe('tempo', () => {
  it('converte HH:MM de e para minutos', () => {
    expect(paraMinutos('09:20')).toBe(560);
    expect(deMinutos(560)).toBe('09:20');
    expect(deMinutos(paraMinutos('00:05'))).toBe('00:05');
  });

  it('calcula o dia da semana a partir do texto da data', () => {
    expect(diaDaSemana('2026-11-01')).toBe('DOM');
    expect(diaDaSemana('2026-11-02')).toBe('SEG');
    expect(diaDaSemana('2026-11-07')).toBe('SAB');
  });

  it('valida datas reais', () => {
    expect(ehDataReal('2026-02-28')).toBe(true);
    expect(ehDataReal('2026-02-30')).toBe(false);
    expect(ehDataReal('2026-13-01')).toBe(false);
    expect(ehDataReal('26-01-01')).toBe(false);
  });

  it('valida data e hora reais', () => {
    expect(ehDataHoraReal('2026-11-03T09:20')).toBe(true);
    expect(ehDataHoraReal('2026-11-03T24:00')).toBe(false);
    expect(ehDataHoraReal('2026-11-03T09:60')).toBe(false);
    expect(ehDataHoraReal('2026-11-03 09:20')).toBe(false);
    expect(ehDataHoraReal('2026-02-30T09:20')).toBe(false);
  });
});
