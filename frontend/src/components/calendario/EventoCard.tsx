import type { Agendamento } from '../../api/types'
import { variaveis } from '../../utils/classes'
import { horaDe } from '../../utils/datas'
import { modalidadeDoExame } from '../../utils/modalidade'
import { IconeRelogio, IconeUsuario } from '../icones'

interface Props {
  agendamento: Agendamento
  exameNome: string
  /** Se informado, o cartão vira um botão. Sem ele é só informativo. */
  onSelecionar?: (agendamento: Agendamento) => void
  selecionado?: boolean
}

/** Exame marcado: borda e fundo na cor da modalidade, horário e selo. */
export default function EventoCard({ agendamento, exameNome, onSelecionar, selecionado }: Props) {
  const modalidade = modalidadeDoExame(exameNome)
  const hora = horaDe(agendamento.inicio)
  const estilo = variaveis({ '--mod-cor': modalidade.cor, '--mod-fundo': modalidade.fundo })
  const conteudo = (
    <>
      <span className="evento__titulo">{exameNome}</span>
      <span className="evento__paciente">
        <IconeUsuario tamanho={12} />
        <span>{agendamento.pacienteNome}</span>
      </span>
      <span className="evento__rodape">
        <span className="evento__hora">
          <IconeRelogio tamanho={12} />
          {hora}
        </span>
        <span className="evento__selo" aria-hidden="true" title={modalidade.rotulo}>
          {modalidade.rotulo.charAt(0)}
        </span>
      </span>
    </>
  )

  if (!onSelecionar) {
    return (
      <div className="evento" style={estilo}>
        {conteudo}
      </div>
    )
  }
  return (
    <button
      type="button"
      className="evento evento--botao"
      style={estilo}
      aria-label={`${exameNome}, ${agendamento.pacienteNome}, ${hora}`}
      aria-pressed={selecionado ?? false}
      onClick={() => onSelecionar(agendamento)}
    >
      {conteudo}
    </button>
  )
}
