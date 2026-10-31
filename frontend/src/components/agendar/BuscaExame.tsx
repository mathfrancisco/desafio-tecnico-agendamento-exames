import { useId, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { buscarExames } from '../../api/client'
import type { Exame } from '../../api/types'
import { useDebounce } from '../../hooks/useDebounce'
import { useRequisicao } from '../../hooks/useRequisicao'
import ErroRetry from '../layout/ErroRetry'
import { IconeBusca } from '../icones'

interface Props {
  onSelecionar: (exame: Exame) => void
}

const ATRASO_MS = 300

/** Busca de exame por nome (debounce de 300 ms) com lista de resultados. */
export default function BuscaExame({ onSelecionar }: Props) {
  const id = useId()
  const [termo, setTermo] = useState('')
  const [aberto, setAberto] = useState(false)
  const termoAtrasado = useDebounce(termo.trim(), ATRASO_MS)
  const [exames, recarregar] = useRequisicao(
    () => buscarExames(termoAtrasado),
    aberto ? `exames|${termoAtrasado}` : null,
  )

  function aoSairDoFoco(evento: FocusEvent<HTMLDivElement>) {
    if (!evento.currentTarget.contains(evento.relatedTarget)) setAberto(false)
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === 'Escape' && aberto) {
      evento.stopPropagation()
      setAberto(false)
    }
  }

  function selecionar(exame: Exame) {
    onSelecionar(exame)
    setTermo('')
    setAberto(false)
  }

  return (
    <div className="busca" onBlur={aoSairDoFoco} onKeyDown={aoTeclar}>
      <label htmlFor={id} className="sr-only">
        Buscar exame pelo nome
      </label>
      <span className="busca__icone">
        <IconeBusca tamanho={18} />
      </span>
      <input
        id={id}
        type="search"
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        placeholder="Buscar exame pelo nome…"
        autoComplete="off"
      />

      {aberto && (
        // mouseDown não pode tirar o foco do input, senão a lista fecha antes do clique
        <div className="busca__lista" onMouseDown={(e) => e.preventDefault()}>
          <div aria-live="polite">
            {exames.status === 'carregando' && <p className="estado">Buscando exames…</p>}
            {exames.status === 'ok' && exames.dados.length === 0 && (
              <p className="estado">Nenhum exame encontrado</p>
            )}
          </div>
          {exames.status === 'erro' && (
            <ErroRetry mensagem={exames.mensagem} onTentar={recarregar} />
          )}
          {exames.status === 'ok' && exames.dados.length > 0 && (
            <ul>
              {exames.dados.map((exame) => (
                <li key={exame.id}>
                  <button type="button" className="busca__opcao" onClick={() => selecionar(exame)}>
                    <span>{exame.nome}</span>
                    <span className="busca__duracao">{exame.duracaoMinutos} min</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
