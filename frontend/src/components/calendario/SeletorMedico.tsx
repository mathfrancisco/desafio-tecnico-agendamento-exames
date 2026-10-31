import type { Medico } from '../../api/types'
import { diasAtendidos } from '../../utils/turnos'

interface Props {
  medicos: Medico[]
  /** `null` = "Todos" (só existe com `comTodos`). */
  selecionadoId: number | null
  onSelecionar: (medicoId: number | null) => void
  rotulo: string
  /** Mostra o chip "Todos" (filtro). */
  comTodos?: boolean
  /** Mostra sob o nome os dias da semana em que o médico atende. */
  mostrarDias?: boolean
}

/** Chips de médico: escolha (Agendar) ou filtro (Agendamentos). */
export default function SeletorMedico({
  medicos,
  selecionadoId,
  onSelecionar,
  rotulo,
  comTodos,
  mostrarDias,
}: Props) {
  return (
    <div className="chips" role="group" aria-label={rotulo}>
      {comTodos && (
        <button
          type="button"
          className="chip"
          aria-pressed={selecionadoId === null}
          onClick={() => onSelecionar(null)}
        >
          Todos
        </button>
      )}
      {medicos.map((medico) => {
        const dias = diasAtendidos(medico)
        return (
          <button
            key={medico.id}
            type="button"
            className="chip"
            aria-pressed={selecionadoId === medico.id}
            title={`Atende: ${dias}`}
            onClick={() => onSelecionar(medico.id)}
          >
            <span className="chip__nome">{medico.nome}</span>
            {mostrarDias && <span className="chip__dias">{dias}</span>}
          </button>
        )
      })}
    </div>
  )
}
