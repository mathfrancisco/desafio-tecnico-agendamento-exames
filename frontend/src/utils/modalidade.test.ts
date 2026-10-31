import { describe, expect, it } from 'vitest'
import { modalidadeDoExame } from './modalidade'

describe('modalidadeDoExame', () => {
  it.each([
    ['Raio-X de Tórax', 'Raio-X'],
    ['Raio-X Panorâmico de Mandíbula', 'Raio-X'],
    ['Mamografia Bilateral', 'Mamografia'],
    ['Mamografia Digital com Tomossíntese', 'Mamografia'],
    ['Ultrassonografia de Mama', 'Ultrassonografia'],
    ['Doppler de Carótidas', 'Doppler'],
    ['Ecocardiograma com Doppler', 'Ecocardiograma'],
    ['Tomografia Computadorizada de Crânio', 'Tomografia'],
    ['Angiotomografia Coronariana', 'Tomografia'],
    ['Ressonância Magnética de Joelho', 'Ressonância'],
    ['Densitometria Óssea', 'Densitometria'],
    ['Cintilografia Miocárdica', 'Cintilografia'],
  ])('%s -> %s', (nome, rotulo) => {
    expect(modalidadeDoExame(nome).rotulo).toBe(rotulo)
  })

  it('ignora acentos e maiúsculas', () => {
    expect(modalidadeDoExame('RESSONANCIA magnetica').rotulo).toBe('Ressonância')
  })

  it('cai em "Exame" para nomes desconhecidos', () => {
    expect(modalidadeDoExame('Eletroencefalograma').rotulo).toBe('Exame')
  })

  it('cada modalidade tem cor forte e fundo claro distintos', () => {
    const nomes = [
      'Raio-X', 'Mamografia', 'Ultrassonografia', 'Ecocardiograma', 'Doppler',
      'Tomografia', 'Ressonância', 'Densitometria', 'Cintilografia',
    ]
    const cores = nomes.map((n) => modalidadeDoExame(n).cor)
    expect(new Set(cores).size).toBe(nomes.length)
    for (const nome of nomes) {
      const { cor, fundo } = modalidadeDoExame(nome)
      expect(cor).toMatch(/^#[0-9a-f]{6}$/)
      expect(fundo).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
