import { useId } from 'react'
import { buscarHorarios } from '../api/client'
import type { Exame, Horario, Medico } from '../api/types'
import { formatarData } from '../datas'
import { useRequisicao } from '../useRequisicao'

interface Props {
  exame: Exame
  medico: Medico
  data: string
  /** Muda para forçar nova consulta (ex.: após conflito 409). */
  versao: number
  selecionado: Horario | null
  /** Aviso a destacar acima da lista (ex.: horário acabou de ser ocupado). */
  aviso?: string | null
  onSelecionar: (horario: Horario) => void
}

export default function HorariosLista({
  exame,
  medico,
  data,
  versao,
  selecionado,
  aviso,
  onSelecionar,
}: Props) {
  const id = useId()
  const horarios = useRequisicao(
    () => buscarHorarios(medico.id, exame.id, data),
    `${medico.id}|${exame.id}|${data}|${versao}`,
  )

  return (
    <section className="etapa" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>3. Horário</h2>
      <p className="estado">
        {medico.nome}, {formatarData(data)}, {exame.nome} ({exame.duracaoMinutos} min)
      </p>

      {aviso && (
        <p className="aviso" role="alert">
          {aviso}
        </p>
      )}

      <div aria-live="polite">
        {horarios.status === 'carregando' && <p className="estado">Carregando horários…</p>}
        {horarios.status === 'erro' && (
          <p className="estado erro" role="alert">
            {horarios.mensagem}
          </p>
        )}
        {horarios.status === 'ok' && horarios.dados.horarios.length === 0 && (
          <p className="estado">
            Nenhum horário disponível. O médico pode não atender neste dia, todos os horários
            já foram ocupados ou os horários de hoje já passaram. Tente outra data ou outro
            médico.
          </p>
        )}
      </div>

      {horarios.status === 'ok' && horarios.dados.horarios.length > 0 && (
        <ul className="grade-horarios">
          {horarios.dados.horarios.map((horario) => (
            <li key={horario.inicio}>
              <button
                type="button"
                className="opcao horario"
                aria-pressed={selecionado?.inicio === horario.inicio}
                onClick={() => onSelecionar(horario)}
              >
                {horario.inicio}–{horario.fim}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
