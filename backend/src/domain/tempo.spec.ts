import {
  deMinutos,
  diaDaSemana,
  diasDoMes,
  ehDataHoraReal,
  ehDataReal,
  ehMes,
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

  it('valida meses no formato YYYY-MM', () => {
    expect(ehMes('2026-11')).toBe(true);
    expect(ehMes('2026-12')).toBe(true);
    expect(ehMes('2026-00')).toBe(false);
    expect(ehMes('2026-13')).toBe(false);
    expect(ehMes('2026-1')).toBe(false);
    expect(ehMes('2026-11-01')).toBe(false);
  });

  it('lista os dias do mês, inclusive fevereiro bissexto', () => {
    const novembro = diasDoMes('2026-11');
    expect(novembro).toHaveLength(30);
    expect(novembro[0]).toBe('2026-11-01');
    expect(novembro[29]).toBe('2026-11-30');
    expect(diasDoMes('2026-12')).toHaveLength(31);
    expect(diasDoMes('2026-02')).toHaveLength(28);
    expect(diasDoMes('2028-02')).toHaveLength(29);
  });

  it('valida data e hora reais', () => {
    expect(ehDataHoraReal('2026-11-03T09:20')).toBe(true);
    expect(ehDataHoraReal('2026-11-03T24:00')).toBe(false);
    expect(ehDataHoraReal('2026-11-03T09:60')).toBe(false);
    expect(ehDataHoraReal('2026-11-03 09:20')).toBe(false);
    expect(ehDataHoraReal('2026-02-30T09:20')).toBe(false);
  });
});
