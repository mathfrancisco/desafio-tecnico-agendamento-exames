import type { DiaSemana, Medico } from '../api/types'

const ORDEM: DiaSemana[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']
const NOMES: Record<DiaSemana, string> = {
  SEG: 'Seg',
  TER: 'Ter',
  QUA: 'Qua',
  QUI: 'Qui',
  SEX: 'Sex',
  SAB: 'Sáb',
  DOM: 'Dom',
}

/** Dias da semana em que o médico atende: `Seg a Sex`, `Ter, Qui`, `Seg, Qua a Sex`. */
export function diasAtendidos(medico: Medico): string {
  const indices = ORDEM.map((dia, i) => (medico.turnos.some((t) => t.dia === dia) ? i : -1)).filter(
    (i) => i >= 0,
  )
  const trechos: string[] = []
  for (let i = 0; i < indices.length; ) {
    let fim = i
    while (fim + 1 < indices.length && indices[fim + 1] === indices[fim] + 1) fim++
    const primeiro = NOMES[ORDEM[indices[i]]]
    const ultimo = NOMES[ORDEM[indices[fim]]]
    if (fim - i >= 2) trechos.push(`${primeiro} a ${ultimo}`)
    else for (let k = i; k <= fim; k++) trechos.push(NOMES[ORDEM[indices[k]]])
    i = fim + 1
  }
  return trechos.join(', ')
}
