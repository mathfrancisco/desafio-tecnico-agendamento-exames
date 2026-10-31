import { useState } from 'react'
import type { Agendamento } from '../../api/types'
import EventoCard from './EventoCard'

interface Props {
  agendamentos: Agendamento[]
  nomeDoExame: (exameId: number) => string
  /** Quantos cartões mostrar antes de "+N mais". */
  limite: number
  selecionadoId?: number | null
  onSelecionar?: (agendamento: Agendamento) => void
}

/** Lista compacta dos exames de um dia, com "+N mais" quando passa do limite. */
export default function EventosDoDia({
  agendamentos,
  nomeDoExame,
  limite,
  selecionadoId,
  onSelecionar,
}: Props) {
  const [expandido, setExpandido] = useState(false)
  if (agendamentos.length === 0) return null

  const visiveis = expandido ? agendamentos : agendamentos.slice(0, limite)
  const restantes = agendamentos.length - visiveis.length

  return (
    <ul className="eventos">
      {visiveis.map((agendamento) => (
        <li key={agendamento.id}>
          <EventoCard
            agendamento={agendamento}
            exameNome={nomeDoExame(agendamento.exameId)}
            onSelecionar={onSelecionar}
            selecionado={selecionadoId === agendamento.id}
          />
        </li>
      ))}
      {restantes > 0 && (
        <li>
          {onSelecionar ? (
            <button type="button" className="eventos__mais" onClick={() => setExpandido(true)}>
              +{restantes} mais
            </button>
          ) : (
            <span className="eventos__mais">+{restantes} mais</span>
          )}
        </li>
      )}
      {expandido && agendamentos.length > limite && (
        <li>
          <button type="button" className="eventos__mais" onClick={() => setExpandido(false)}>
            Mostrar menos
          </button>
        </li>
      )}
    </ul>
  )
}
