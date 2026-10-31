import { deslocarMes, hojeLocal, mesDe, nomeDoMes } from '../../utils/datas'
import { IconeSetaDireita, IconeSetaEsquerda } from '../icones'

interface Props {
  mes: string
  onMes: (mes: string) => void
  /** Impede voltar antes deste mês (`YYYY-MM`), se informado. */
  mesMinimo?: string
}

export default function NavegacaoMes({ mes, onMes, mesMinimo }: Props) {
  const anterior = deslocarMes(mes, -1)
  const noMinimo = mesMinimo !== undefined && anterior < mesMinimo

  return (
    <div className="nav-mes" role="group" aria-label="Navegação de mês">
      <button
        type="button"
        className="nav-mes__botao nav-mes__hoje"
        onClick={() => onMes(mesDe(hojeLocal()))}
      >
        Hoje
      </button>
      <button
        type="button"
        className="nav-mes__botao"
        aria-label="Mês anterior"
        disabled={noMinimo}
        onClick={() => onMes(anterior)}
      >
        <IconeSetaEsquerda tamanho={16} />
      </button>
      <span className="nav-mes__titulo" aria-live="polite">
        {nomeDoMes(mes)}
      </span>
      <button
        type="button"
        className="nav-mes__botao"
        aria-label="Próximo mês"
        onClick={() => onMes(deslocarMes(mes, 1))}
      >
        <IconeSetaDireita tamanho={16} />
      </button>
    </div>
  )
}
