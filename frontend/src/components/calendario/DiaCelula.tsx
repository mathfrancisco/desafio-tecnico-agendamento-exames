import type { ReactNode } from 'react'
import { cx } from '../../utils/classes'
import { DIAS_SEMANA_CURTOS, formatarDataLonga, indiceSemana } from '../../utils/datas'

interface Props {
  /** `YYYY-MM-DD` */
  data: string
  hoje?: boolean
  /** Dia sem vaga ou passado: aparência esmaecida. */
  apagado?: boolean
  selecionado?: boolean
  /** Some na lista do celular (ex.: dia sem agendamentos), para não rolar por dias vazios. */
  ocultarNoCelular?: boolean
  /** Torna a célula inteira clicável por um botão com este rótulo acessível. */
  acao?: { rotulo: string; onClick: () => void }
  children?: ReactNode
}

export default function DiaCelula({
  data,
  hoje,
  apagado,
  selecionado,
  ocultarNoCelular,
  acao,
  children,
}: Props) {
  return (
    <li
      className={cx(
        'dia',
        hoje && 'dia--hoje',
        apagado && 'dia--apagado',
        selecionado && 'dia--selecionado',
        acao && 'dia--clicavel',
        ocultarNoCelular && 'dia--so-grade',
      )}
      aria-current={hoje ? 'date' : undefined}
    >
      {acao && (
        <button
          type="button"
          className="dia__alvo"
          aria-label={acao.rotulo}
          aria-pressed={selecionado ?? false}
          onClick={acao.onClick}
        />
      )}
      <div className="dia__conteudo">
        <div className="dia__topo" aria-hidden="true">
          <span className="dia__semana">{DIAS_SEMANA_CURTOS[indiceSemana(data)]}</span>
          <span className="dia__numero">{Number(data.slice(8))}</span>
        </div>
        <span className="sr-only">{formatarDataLonga(data)}</span>
        {children}
      </div>
    </li>
  )
}
