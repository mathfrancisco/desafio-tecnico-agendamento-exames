import { useState } from 'react'
import { buscarDisponibilidade, listarAgendamentos } from '../../api/client'
import type { Exame, Medico } from '../../api/types'
import { useRequisicao } from '../../hooks/useRequisicao'
import { agruparPorDia, nomeDoExamePor } from '../../utils/agendamentos'
import { formatarDiaMes, mesDe, nomeDoMes } from '../../utils/datas'
import Calendario from '../calendario/Calendario'
import DiaCelula from '../calendario/DiaCelula'
import EventosDoDia from '../calendario/EventosDoDia'
import ErroRetry from '../layout/ErroRetry'
import PainelDia from './PainelDia'

interface Props {
  exame: Exame
  medico: Medico
  exames: Exame[]
  /** `YYYY-MM` */
  mes: string
  /** `YYYY-MM-DD`, data de hoje no fuso local. */
  hoje: string
}

const EVENTOS_POR_DIA = 2

function rotuloLivres(livres: number): string {
  return `${livres} ${livres === 1 ? 'horário livre' : 'horários livres'}`
}

/**
 * Calendário do mês para um exame e um médico já escolhidos: quantos horários
 * livres cada dia tem (disponibilidade) e o que o médico já tem marcado.
 */
export default function AgendaDoMedico({ exame, medico, exames, mes, hoje }: Props) {
  const chave = `${medico.id}|${exame.id}|${mes}`
  const [disponibilidade, recarregarDisponibilidade] = useRequisicao(
    () => buscarDisponibilidade(medico.id, exame.id, mes),
    `disponibilidade|${chave}`,
  )
  const [marcados, recarregarMarcados] = useRequisicao(
    () => listarAgendamentos(mes, medico.id),
    `marcados|${chave}`,
  )
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)
  // trocar de mês fecha o painel do dia aberto
  const diaAberto = diaSelecionado !== null && mesDe(diaSelecionado) === mes ? diaSelecionado : null

  const livres =
    disponibilidade.status === 'ok'
      ? new Map(disponibilidade.dados.dias.map((dia) => [dia.data, dia.livres]))
      : null
  const porDia = agruparPorDia(marcados.status === 'ok' ? marcados.dados : [])
  const nomeDoExame = nomeDoExamePor(exames)
  const erro = [disponibilidade, marcados].find((r) => r.status === 'erro')
  const semVagas = livres !== null && [...livres.values()].every((n) => n === 0)

  function recarregar() {
    recarregarDisponibilidade()
    recarregarMarcados()
  }

  return (
    <>
      {erro?.status === 'erro' && <ErroRetry mensagem={erro.mensagem} onTentar={recarregar} />}
      {semVagas && (
        <p className="estado estado--faixa" role="status">
          Nenhum horário livre em {nomeDoMes(mes)} para {medico.nome}. Tente outro mês ou outro
          médico.
        </p>
      )}
      <Calendario
        mes={mes}
        ocupado={disponibilidade.status === 'carregando'}
        renderDia={(data) => {
          const quantidade = livres?.get(data) ?? 0
          const aberto = data >= hoje && quantidade > 0
          return (
            <DiaCelula
              data={data}
              hoje={data === hoje}
              apagado={data < hoje || (livres !== null && quantidade === 0)}
              selecionado={data === diaAberto}
              acao={
                aberto
                  ? {
                      rotulo: `${formatarDiaMes(data)}, ${rotuloLivres(quantidade)}`,
                      onClick: () => setDiaSelecionado(data),
                    }
                  : undefined
              }
            >
              {livres === null && disponibilidade.status === 'carregando' && (
                <span className="pilula pilula--carregando" aria-hidden="true" />
              )}
              {aberto && (
                <span className="pilula pilula--livres">
                  <span className="pilula__longo">{rotuloLivres(quantidade)}</span>
                  <span className="pilula__curto" aria-hidden="true">
                    {quantidade} livres
                  </span>
                </span>
              )}
              <EventosDoDia
                agendamentos={porDia.get(data) ?? []}
                nomeDoExame={nomeDoExame}
                limite={EVENTOS_POR_DIA}
              />
            </DiaCelula>
          )
        }}
      />
      {diaAberto && (
        <PainelDia
          key={diaAberto}
          exame={exame}
          medico={medico}
          data={diaAberto}
          onFechar={() => setDiaSelecionado(null)}
          onAtualizado={recarregar}
        />
      )}
    </>
  )
}
