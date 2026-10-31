import { useState } from 'react'
import { cancelarAgendamento, mensagemDeErro } from '../../api/client'
import type { Agendamento, Exame, Medico } from '../../api/types'
import { dataDe, formatarDataLonga, horaDe } from '../../utils/datas'
import { modalidadeDoExame } from '../../utils/modalidade'
import { IconeCalendario, IconeExame, IconeMedico, IconeRelogio, IconeUsuario } from '../icones'
import LinhaInfo from '../layout/LinhaInfo'
import PainelLateral from '../layout/PainelLateral'

interface Props {
  agendamento: Agendamento
  /** Podem faltar se o catálogo não tiver o id: o painel mostra um texto neutro. */
  exame?: Exame
  medico?: Medico
  onFechar: () => void
  /** Chamado após o 204: o pai fecha o painel e recarrega o mês. */
  onCancelado: () => void
}

/** Detalhes de um agendamento e cancelamento com confirmação explícita. */
export default function PainelAgendamento({
  agendamento,
  exame,
  medico,
  onFechar,
  onCancelado,
}: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const nomeDoExame = exame?.nome ?? `Exame ${agendamento.exameId}`

  async function cancelar() {
    setCancelando(true)
    setMensagem(null)
    try {
      await cancelarAgendamento(agendamento.id)
      onCancelado()
    } catch (erro) {
      setMensagem(mensagemDeErro(erro))
      setConfirmando(false)
    } finally {
      setCancelando(false)
    }
  }

  return (
    <PainelLateral titulo={nomeDoExame} cor={modalidadeDoExame(nomeDoExame).cor} onFechar={onFechar}>
      <dl className="info-lista">
        <LinhaInfo icone={<IconeUsuario tamanho={14} />} rotulo="Paciente">
          {agendamento.pacienteNome}
        </LinhaInfo>
        <LinhaInfo icone={<IconeMedico tamanho={14} />} rotulo="Médico">
          {medico ? `${medico.nome} (${medico.crm})` : `Médico ${agendamento.medicoId}`}
        </LinhaInfo>
        <LinhaInfo icone={<IconeCalendario tamanho={14} />} rotulo="Data">
          {formatarDataLonga(dataDe(agendamento.inicio))}
        </LinhaInfo>
        <LinhaInfo icone={<IconeRelogio tamanho={14} />} rotulo="Horário">
          {horaDe(agendamento.inicio)} – {horaDe(agendamento.fim)}
        </LinhaInfo>
        {exame && (
          <LinhaInfo icone={<IconeExame tamanho={14} />} rotulo="Duração do exame">
            {exame.duracaoMinutos} min
          </LinhaInfo>
        )}
      </dl>

      {mensagem && (
        <p className="mensagem" role="alert">
          {mensagem}
        </p>
      )}

      {confirmando ? (
        <div className="confirmar-cancelamento">
          <p>
            Cancelar o agendamento de <strong>{agendamento.pacienteNome}</strong>? O horário volta
            a ficar livre.
          </p>
          <button
            type="button"
            className="botao botao--perigo"
            disabled={cancelando}
            onClick={cancelar}
          >
            {cancelando ? 'Cancelando…' : 'Sim, cancelar agendamento'}
          </button>
          <button
            type="button"
            className="botao botao--secundario"
            disabled={cancelando}
            autoFocus
            onClick={() => setConfirmando(false)}
          >
            Manter agendamento
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="botao botao--perigo-suave"
          onClick={() => {
            setMensagem(null)
            setConfirmando(true)
          }}
        >
          Cancelar agendamento
        </button>
      )}
    </PainelLateral>
  )
}
