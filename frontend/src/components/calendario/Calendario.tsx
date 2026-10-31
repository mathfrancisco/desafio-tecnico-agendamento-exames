import { Fragment, type ReactNode } from 'react'
import { DIAS_SEMANA_CURTOS, gradeDoMes, nomeDoMes } from '../../utils/datas'

interface Props {
  /** `YYYY-MM` */
  mes: string
  /** Desenha um dia do mês (normalmente um `DiaCelula`). */
  renderDia: (data: string) => ReactNode
  ocupado?: boolean
}

/**
 * Grade mensal, segunda a domingo. Em telas estreitas o CSS transforma a grade
 * numa lista vertical de dias (os espaços fora do mês somem).
 */
export default function Calendario({ mes, renderDia, ocupado }: Props) {
  const posicoes = gradeDoMes(mes).flat()

  return (
    <section className="calendario" aria-label={`Calendário de ${nomeDoMes(mes)}`} aria-busy={ocupado}>
      <ul className="calendario__semana" aria-hidden="true">
        {DIAS_SEMANA_CURTOS.map((dia) => (
          <li key={dia}>{dia}</li>
        ))}
      </ul>
      <ol className="calendario__grade">
        {posicoes.map((data, i) =>
          data === null ? (
            <li key={`vazio-${i}`} className="dia dia--vazio" aria-hidden="true" />
          ) : (
            <Fragment key={data}>{renderDia(data)}</Fragment>
          ),
        )}
      </ol>
    </section>
  )
}
