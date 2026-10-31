import { buscarExames, listarMedicos } from '../api/client'
import type { Exame, Medico } from '../api/types'
import { useRequisicao } from './useRequisicao'

export interface Catalogo {
  medicos: Medico[]
  exames: Exame[]
}

/** Médicos e exames, carregados uma vez: as duas telas precisam dos nomes. */
export function useCatalogo() {
  return useRequisicao<Catalogo>(async () => {
    const [medicos, exames] = await Promise.all([listarMedicos(), buscarExames()])
    return { medicos, exames }
  }, 'catalogo')
}
