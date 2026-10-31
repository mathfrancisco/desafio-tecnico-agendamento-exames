import type { Exame } from '../../api/types'
import BuscaExame from '../agendar/BuscaExame'
import { IconeLocal, Logo } from '../icones'

interface Props {
  onSelecionarExame: (exame: Exame) => void
}

export default function Topbar({ onSelecionarExame }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__marca">
        <Logo />
        <span className="topbar__nome">Agenda Imagem</span>
      </div>
      <BuscaExame onSelecionar={onSelecionarExame} />
      <p className="topbar__clinica">
        <IconeLocal tamanho={16} />
        Clínica de diagnóstico por imagem
      </p>
    </header>
  )
}
