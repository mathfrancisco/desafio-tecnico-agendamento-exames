import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  deslocarMes,
  diasDoMes,
  formatarData,
  formatarDataLonga,
  formatarDiaMes,
  gradeDoMes,
  hojeNaClinica,
  horaDe,
  indiceSemana,
  mesDe,
  nomeDoMes,
} from './datas'

/** Resume a grade: quantas semanas, primeiro/último dia e quantas posições vazias antes/depois. */
function resumo(mes: string) {
  const semanas = gradeDoMes(mes)
  const posicoes = semanas.flat()
  const dias = posicoes.filter((d): d is string => d !== null)
  return {
    semanas: semanas.length,
    vaziosAntes: posicoes.findIndex((d) => d !== null),
    vaziosDepois: posicoes.length - 1 - posicoes.lastIndexOf(dias[dias.length - 1]),
    primeiro: dias[0],
    ultimo: dias[dias.length - 1],
    total: dias.length,
  }
}

describe('gradeDoMes', () => {
  it('mês que começa na segunda-feira não tem espaços antes (jun/2026, 30 dias)', () => {
    expect(resumo('2026-06')).toEqual({
      semanas: 5,
      vaziosAntes: 0,
      vaziosDepois: 5,
      primeiro: '2026-06-01',
      ultimo: '2026-06-30',
      total: 30,
    })
  })

  it('mês de 28 dias que começa no domingo tem seis espaços antes (fev/2026)', () => {
    expect(resumo('2026-02')).toEqual({
      semanas: 5,
      vaziosAntes: 6,
      vaziosDepois: 1,
      primeiro: '2026-02-01',
      ultimo: '2026-02-28',
      total: 28,
    })
  })

  it('mês de 31 dias começando no domingo precisa de seis semanas (mar/2026)', () => {
    expect(resumo('2026-03')).toMatchObject({ semanas: 6, vaziosAntes: 6, total: 31 })
  })

  it('fevereiro bissexto tem 29 dias (fev/2028) e começa na terça', () => {
    expect(resumo('2028-02')).toMatchObject({ vaziosAntes: 1, total: 29, ultimo: '2028-02-29' })
  })

  it('fevereiro de 28 dias começando na segunda cabe em quatro semanas (fev/2027)', () => {
    expect(resumo('2027-02')).toEqual({
      semanas: 4,
      vaziosAntes: 0,
      vaziosDepois: 0,
      primeiro: '2027-02-01',
      ultimo: '2027-02-28',
      total: 28,
    })
  })

  it('toda linha tem 7 posições e a primeira coluna é segunda-feira', () => {
    const semanas = gradeDoMes('2026-11')
    expect(semanas.every((s) => s.length === 7)).toBe(true)
    // 2026-11-01 é domingo: a primeira segunda do mês é o dia 2
    expect(semanas[0][0]).toBeNull()
    expect(semanas[0][6]).toBe('2026-11-01')
    expect(semanas[1][0]).toBe('2026-11-02')
  })

  it('não depende do fuso do navegador (virada de ano)', () => {
    expect(resumo('2026-12')).toMatchObject({ primeiro: '2026-12-01', ultimo: '2026-12-31' })
    expect(resumo('2027-01')).toMatchObject({ vaziosAntes: 4, primeiro: '2027-01-01' })
  })
})

describe('datas', () => {
  it('indiceSemana usa segunda = 0 e domingo = 6', () => {
    expect(indiceSemana('2026-11-02')).toBe(0)
    expect(indiceSemana('2026-11-08')).toBe(6)
  })

  it('diasDoMes lista todos os dias em ordem', () => {
    const dias = diasDoMes('2026-04')
    expect(dias).toHaveLength(30)
    expect(dias[0]).toBe('2026-04-01')
    expect(dias[29]).toBe('2026-04-30')
  })

  it('deslocarMes atravessa o ano nos dois sentidos', () => {
    expect(deslocarMes('2026-12', 1)).toBe('2027-01')
    expect(deslocarMes('2026-01', -1)).toBe('2025-12')
    expect(deslocarMes('2026-11', 14)).toBe('2028-01')
  })

  it('formata nomes e datas em português', () => {
    expect(nomeDoMes('2026-11')).toBe('Novembro de 2026')
    expect(formatarData('2026-11-03T08:00')).toBe('03/11/2026')
    expect(formatarDiaMes('2026-11-03')).toBe('3 de novembro')
    expect(formatarDataLonga('2026-11-03')).toBe('terça-feira, 3 de novembro de 2026')
    expect(horaDe('2026-11-03T08:40')).toBe('08:40')
    expect(mesDe('2026-11-03')).toBe('2026-11')
  })
})

describe('hojeNaClinica', () => {
  afterEach(() => vi.useRealTimers())

  it('usa a data em America/Sao_Paulo, não a UTC nem a do navegador', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-06T02:30:00Z')) // 05/11/2026 23:30 na clínica
    expect(hojeNaClinica()).toBe('2026-11-05')
    vi.setSystemTime(new Date('2026-11-06T03:00:00Z')) // meia-noite na clínica
    expect(hojeNaClinica()).toBe('2026-11-06')
  })
})
