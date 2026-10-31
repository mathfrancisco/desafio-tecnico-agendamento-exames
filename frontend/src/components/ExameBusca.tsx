import { useId, useState } from 'react'
import { buscarExames } from '../api/client'
import type { Exame } from '../api/types'
import { useDebounce } from '../useDebounce'
import { useRequisicao } from '../useRequisicao'

interface Props {
  selecionado: Exame | null
  onSelecionar: (exame: Exame) => void
}

export default function ExameBusca({ selecionado, onSelecionar }: Props) {
  const idBusca = useId()
  const [termo, setTermo] = useState('')
  const termoAtrasado = useDebounce(termo.trim(), 300)
  const exames = useRequisicao(() => buscarExames(termoAtrasado), termoAtrasado)

  return (
    <section className="etapa" aria-labelledby={`${idBusca}-titulo`}>
      <h2 id={`${idBusca}-titulo`}>1. Exame</h2>
      <label htmlFor={idBusca}>Buscar exame pelo nome</label>
      <input
        id={idBusca}
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Ex.: ressonância"
        autoComplete="off"
      />

      <div aria-live="polite">
        {exames.status === 'carregando' && <p className="estado">Carregando exames…</p>}
        {exames.status === 'erro' && (
          <p className="estado erro" role="alert">
            {exames.mensagem}
          </p>
        )}
        {exames.status === 'ok' && exames.dados.length === 0 && (
          <p className="estado">Nenhum exame encontrado</p>
        )}
      </div>

      {exames.status === 'ok' && exames.dados.length > 0 && (
        <ul className="lista-opcoes">
          {exames.dados.map((exame) => (
            <li key={exame.id}>
              <button
                type="button"
                className="opcao"
                aria-pressed={selecionado?.id === exame.id}
                onClick={() => onSelecionar(exame)}
              >
                <span>{exame.nome}</span>
                <span className="detalhe">{exame.duracaoMinutos} min</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
