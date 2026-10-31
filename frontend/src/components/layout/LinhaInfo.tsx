import type { ReactNode } from 'react'

interface Props {
  icone: ReactNode
  rotulo: string
  children: ReactNode
}

/** Linha de detalhe do painel: valor em destaque e rótulo discreto, com ícone. */
export default function LinhaInfo({ icone, rotulo, children }: Props) {
  return (
    <div className="info">
      <dt>
        {icone}
        {rotulo}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}
