import type { Agendamento, Exame } from '../api/types'
import { dataDe } from './datas'

/** Agrupa por data (`YYYY-MM-DD`), mantendo a ordem recebida dentro de cada dia. */
export function agruparPorDia(agendamentos: Agendamento[]): Map<string, Agendamento[]> {
  const grupos = new Map<string, Agendamento[]>()
  for (const agendamento of agendamentos) {
    const dia = dataDe(agendamento.inicio)
    grupos.set(dia, [...(grupos.get(dia) ?? []), agendamento])
  }
  return grupos
}

/** Função que devolve o nome do exame pelo id (ou um texto neutro se não existir). */
export function nomeDoExamePor(exames: Exame[]): (exameId: number) => string {
  return (exameId) => exames.find((e) => e.id === exameId)?.nome ?? `Exame ${exameId}`
}
