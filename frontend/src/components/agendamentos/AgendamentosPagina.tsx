import { useState } from 'react'
import { listarAgendamentos } from '../../api/client'
import type { Exame, Medico } from '../../api/types'
import { useRequisicao } from '../../hooks/useRequisicao'
import { agruparPorDia, nomeDoExamePor } from '../../utils/agendamentos'
import { hojeLocal, mesDe, nomeDoMes } from '../../utils/datas'
import Calendario from '../calendario/Calendario'
import DiaCelula from '../calendario/DiaCelula'
import EventosDoDia from '../calendario/EventosDoDia'
import NavegacaoMes from '../calendario/NavegacaoMes'
import SeletorMedico from '../calendario/SeletorMedico'
import ErroRetry from '../layout/ErroRetry'
import PainelAgendamento from './PainelAgendamento'

interface Props {
  medicos: Medico[]
  exames: Exame[]
}

const EVENTOS_POR_DIA = 3

export default function AgendamentosPagina({ medicos, exames }: Props) {
  const [hoje] = useState(hojeLocal)
  const [mes, setMes] = useState(() => mesDe(hoje))
  const [medicoId, setMedicoId] = useState<number | null>(null)
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null)
  const [agendamentos, recarregar] = useRequisicao(
    () => listarAgendamentos(mes, medicoId ?? undefined),
    `agendamentos|${mes}|${medicoId ?? 'todos'}`,
  )

  const porDia = agruparPorDia(agendamentos.status === 'ok' ? agendamentos.dados : [])
  const nomeDoExame = nomeDoExamePor(exames)
  const medicoFiltrado = medicos.find((m) => m.id === medicoId)

  const selecionado =
    agendamentos.status === 'ok'
      ? (agendamentos.dados.find((a) => a.id === selecionadoId) ?? null)
      : null

  function cancelado() {
    setSelecionadoId(null)
    recarregar()
  }

  function mudarMes(novo: string) {
    setMes(novo)
    setSelecionadoId(null)
  }

  function mudarMedico(id: number | null) {
    setMedicoId(id)
    setSelecionadoId(null)
  }

  return (
    <>
      <section className="cabecalho" aria-labelledby="titulo-agendamentos">
        <h1 id="titulo-agendamentos" className="cabecalho__titulo">
          <span className="marcador" aria-hidden="true" />
          Agendamentos
        </h1>
        <div className="cabecalho__linha">
          <SeletorMedico
            medicos={medicos}
            selecionadoId={medicoId}
            onSelecionar={mudarMedico}
            rotulo="Filtrar por médico"
            comTodos
          />
          <NavegacaoMes mes={mes} onMes={mudarMes} />
        </div>
      </section>

      {agendamentos.status === 'erro' && (
        <ErroRetry mensagem={agendamentos.mensagem} onTentar={recarregar} />
      )}
      {agendamentos.status === 'carregando' && (
        <p className="estado estado--faixa" role="status">
          Carregando agendamentos…
        </p>
      )}
      {agendamentos.status === 'ok' && agendamentos.dados.length === 0 && (
        <p className="estado estado--faixa" role="status">
          Nenhum agendamento em {nomeDoMes(mes)}
          {medicoFiltrado ? ` para ${medicoFiltrado.nome}` : ''}.
        </p>
      )}

      <Calendario
        mes={mes}
        ocupado={agendamentos.status === 'carregando'}
        renderDia={(data) => (
          <DiaCelula data={data} hoje={data === hoje}>
            <EventosDoDia
              agendamentos={porDia.get(data) ?? []}
              nomeDoExame={nomeDoExame}
              limite={EVENTOS_POR_DIA}
              selecionadoId={selecionadoId}
              onSelecionar={(agendamento) => setSelecionadoId(agendamento.id)}
            />
          </DiaCelula>
        )}
      />
      {selecionado && (
        <PainelAgendamento
          key={selecionado.id}
          agendamento={selecionado}
          exame={exames.find((e) => e.id === selecionado.exameId)}
          medico={medicos.find((m) => m.id === selecionado.medicoId)}
          onFechar={() => setSelecionadoId(null)}
          onCancelado={cancelado}
        />
      )}
    </>
  )
}
