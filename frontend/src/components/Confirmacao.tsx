import type { Agendamento, Exame, Medico } from '../api/types'
import { formatarData } from '../datas'

interface Props {
  agendamento: Agendamento
  exame: Exame
  medico: Medico
  onNovo: () => void
}

export default function Confirmacao({ agendamento, exame, medico, onNovo }: Props) {
  return (
    <section className="etapa confirmacao" aria-labelledby="confirmacao-titulo">
      <h2 id="confirmacao-titulo">Agendamento confirmado</h2>
      <dl className="resumo">
        <dt>Paciente</dt>
        <dd>{agendamento.pacienteNome}</dd>
        <dt>Exame</dt>
        <dd>{exame.nome}</dd>
        <dt>Médico</dt>
        <dd>{medico.nome}</dd>
        <dt>Data</dt>
        <dd>{formatarData(agendamento.inicio)}</dd>
        <dt>Horário</dt>
        <dd>
          {agendamento.inicio.slice(11, 16)}–{agendamento.fim.slice(11, 16)}
        </dd>
      </dl>
      <button type="button" className="primario" onClick={onNovo}>
        Novo agendamento
      </button>
    </section>
  )
}
