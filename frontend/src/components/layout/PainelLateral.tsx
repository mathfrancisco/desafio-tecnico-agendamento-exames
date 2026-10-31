import { useEffect, useId, useRef, type ReactNode } from 'react'
import { variaveis } from '../../utils/classes'
import { IconeFechar } from '../icones'

interface Props {
  titulo: string
  /** Cor do marcador ao lado do título (ex.: cor da modalidade). */
  cor?: string
  onFechar: () => void
  children: ReactNode
}

/**
 * Cartão flutuante ao lado do calendário. Recebe o foco ao abrir, fecha com
 * Esc ou pelo botão, e devolve o foco a quem o tinha quando some.
 */
export default function PainelLateral({ titulo, cor, onFechar, children }: Props) {
  const idTitulo = useId()
  const painel = useRef<HTMLElement>(null)

  useEffect(() => {
    const raiz = painel.current
    const anterior = document.activeElement as HTMLElement | null
    raiz?.focus()
    return () => {
      const atual = document.activeElement
      // só devolve o foco se ele se perdeu junto com o painel
      if (!atual || atual === document.body || raiz?.contains(atual)) anterior?.focus()
    }
  }, [])

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  return (
    <aside ref={painel} className="painel" role="dialog" aria-labelledby={idTitulo} tabIndex={-1}>
      <header className="painel__cabecalho">
        <span
          className="marcador"
          style={cor ? variaveis({ '--marcador': cor }) : undefined}
          aria-hidden="true"
        />
        <h2 id={idTitulo}>{titulo}</h2>
        <button type="button" className="painel__fechar" aria-label="Fechar painel" onClick={onFechar}>
          <IconeFechar tamanho={18} />
        </button>
      </header>
      <div className="painel__corpo">{children}</div>
    </aside>
  )
}
