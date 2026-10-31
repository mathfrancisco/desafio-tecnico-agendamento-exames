import type { ReactNode } from 'react'
import { IconeCalendario, IconeLista } from '../icones'

export type Tela = 'agendar' | 'agendamentos'

const ITENS: { tela: Tela; rotulo: string; icone: ReactNode }[] = [
  { tela: 'agendar', rotulo: 'Agendar exame', icone: <IconeCalendario /> },
  { tela: 'agendamentos', rotulo: 'Agendamentos', icone: <IconeLista /> },
]

interface Props {
  tela: Tela
  onTela: (tela: Tela) => void
}

export default function Sidebar({ tela, onTela }: Props) {
  return (
    <nav className="sidebar" aria-label="Principal">
      <ul>
        {ITENS.map((item) => (
          <li key={item.tela}>
            <button
              type="button"
              className="sidebar__item"
              aria-current={item.tela === tela ? 'page' : undefined}
              onClick={() => onTela(item.tela)}
            >
              {item.icone}
              <span>{item.rotulo}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
