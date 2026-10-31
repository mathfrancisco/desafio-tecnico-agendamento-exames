import { describe, expect, it } from 'vitest'
import type { DiaSemana, Medico } from '../api/types'
import { diasAtendidos } from './turnos'

function medicoCom(...dias: DiaSemana[]): Medico {
  return {
    id: 1,
    nome: 'Dr. Teste',
    crm: 'CRM-MG 1',
    turnos: dias.map((dia) => ({ dia, inicio: '08:00', fim: '12:00' })),
  }
}

describe('diasAtendidos', () => {
  it('resume dias seguidos com "a"', () => {
    expect(diasAtendidos(medicoCom('SEG', 'TER', 'QUA', 'QUI', 'SEX'))).toBe('Seg a Sex')
    expect(diasAtendidos(medicoCom('TER', 'QUA', 'QUI', 'SEX', 'SAB'))).toBe('Ter a Sáb')
  })

  it('lista dias soltos e pares', () => {
    expect(diasAtendidos(medicoCom('TER', 'QUI'))).toBe('Ter, Qui')
    expect(diasAtendidos(medicoCom('SEG', 'TER'))).toBe('Seg, Ter')
  })

  it('ignora turnos repetidos do mesmo dia e mistura trechos', () => {
    const medico = medicoCom('SEG', 'SEG', 'QUA', 'QUI', 'SEX', 'DOM')
    expect(diasAtendidos(medico)).toBe('Seg, Qua a Sex, Dom')
  })
})
