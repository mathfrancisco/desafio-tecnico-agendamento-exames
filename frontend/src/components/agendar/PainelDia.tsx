import { useId, useState, type FormEvent } from 'react'
import { ApiError, buscarHorarios, criarAgendamento, mensagemDeErro } from '../../api/client'
import type { Agendamento, Exame, Medico } from '../../api/types'
import { useRequisicao } from '../../hooks/useRequisicao'
import { formatarDataLonga, horaDe } from '../../utils/datas'
import { modalidadeDoExame } from '../../utils/modalidade'
import { IconeExame, IconeMedico, IconeRelogio, IconeUsuario } from '../icones'
import ErroRetry from '../layout/ErroRetry'
import LinhaInfo from '../layout/LinhaInfo'
import PainelLateral from '../layout/PainelLateral'

const NOME_MIN = 3
const NOME_MAX = 100
const AVISO_CONFLITO =
  'Este horário acabou de ser ocupado por outra pessoa. Escolha outro horário da lista atualizada.'

function validarNome(nome: string): string | null {
  const tamanho = nome.trim().length
  if (tamanho === 0) return 'Informe o nome do paciente.'
  if (tamanho < NOME_MIN) return `O nome deve ter pelo menos ${NOME_MIN} caracteres.`
  if (tamanho > NOME_MAX) return `O nome deve ter no máximo ${NOME_MAX} caracteres.`
  return null
}

interface Props {
  exame: Exame
  medico: Medico
  /** `YYYY-MM-DD` */
  data: string
  /** Nome digitado; fica com o pai para sobreviver à troca de dia ou médico (ex.: após um 409). */
  nome: string
  onNome: (nome: string) => void
  onFechar: () => void
  /** Chamado quando a agenda mudou (agendou ou tomou 409): o pai recarrega o mês. */
  onAtualizado: () => void
}

/** Painel de um dia: escolher horário livre, informar o paciente e agendar. */
export default function PainelDia({
  exame,
  medico,
  data,
  nome,
  onNome,
  onFechar,
  onAtualizado,
}: Props) {
  const id = useId()
  const [horarios, recarregarHorarios] = useRequisicao(
    () => buscarHorarios(medico.id, exame.id, data),
    `horarios|${medico.id}|${exame.id}|${data}`,
  )
  const [inicio, setInicio] = useState<string | null>(null)
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [criado, setCriado] = useState<Agendamento | null>(null)

  const erroNome = tentou ? validarNome(nome) : null
  const erroHorario = tentou && inicio === null ? 'Escolha um horário.' : null

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    if (inicio === null || validarNome(nome) !== null) return

    setEnviando(true)
    setMensagem(null)
    try {
      setCriado(
        await criarAgendamento({
          pacienteNome: nome.trim(),
          exameId: exame.id,
          medicoId: medico.id,
          inicio: `${data}T${inicio}`,
        }),
      )
      onNome('')
      onAtualizado()
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 409) {
        setMensagem(AVISO_CONFLITO)
        setInicio(null)
        recarregarHorarios()
        onAtualizado()
      } else {
        setMensagem(mensagemDeErro(erro))
      }
    } finally {
      setEnviando(false)
    }
  }

  function agendarOutro() {
    setCriado(null)
    setInicio(null)
    setTentou(false)
    setMensagem(null)
    recarregarHorarios()
  }

  return (
    <PainelLateral
      titulo={formatarDataLonga(data)}
      cor={modalidadeDoExame(exame.nome).cor}
      onFechar={onFechar}
    >
      <dl className="info-lista">
        <LinhaInfo icone={<IconeExame tamanho={14} />} rotulo="Exame">
          {exame.nome} ({exame.duracaoMinutos} min)
        </LinhaInfo>
        <LinhaInfo icone={<IconeMedico tamanho={14} />} rotulo="Médico">
          {medico.nome}
        </LinhaInfo>
      </dl>

      {criado ? (
        <div className="confirmacao" role="status">
          <h3>Agendamento confirmado</h3>
          <dl className="info-lista">
            <LinhaInfo icone={<IconeUsuario tamanho={14} />} rotulo="Paciente">
              {criado.pacienteNome}
            </LinhaInfo>
            <LinhaInfo icone={<IconeRelogio tamanho={14} />} rotulo="Horário">
              {horaDe(criado.inicio)}–{horaDe(criado.fim)}
            </LinhaInfo>
          </dl>
          <button type="button" className="botao botao--primario" onClick={agendarOutro}>
            Agendar outro horário
          </button>
          <button type="button" className="botao botao--secundario" onClick={onFechar}>
            Fechar
          </button>
        </div>
      ) : (
        <>
          <div aria-live="polite">
            {horarios.status === 'carregando' && (
              <p className="estado">Carregando horários…</p>
            )}
            {horarios.status === 'ok' && horarios.dados.horarios.length === 0 && (
              <p className="estado">
                Nenhum horário livre neste dia. Escolha outro dia ou outro médico.
              </p>
            )}
          </div>
          {mensagem && (
            <p className="mensagem" role="alert">
              {mensagem}
            </p>
          )}
          {horarios.status === 'erro' && (
            <ErroRetry mensagem={horarios.mensagem} onTentar={recarregarHorarios} />
          )}
          {horarios.status === 'ok' && horarios.dados.horarios.length > 0 && (
            <form onSubmit={enviar} noValidate>
              <fieldset className="horarios">
                <legend>Horários livres</legend>
                <ul>
                  {horarios.dados.horarios.map((horario) => (
                    <li key={horario.inicio}>
                      <button
                        type="button"
                        className="horario"
                        aria-pressed={inicio === horario.inicio}
                        onClick={() => {
                          setInicio(horario.inicio)
                          setMensagem(null)
                        }}
                      >
                        {horario.inicio}–{horario.fim}
                      </button>
                    </li>
                  ))}
                </ul>
                {erroHorario && <p className="campo__erro">{erroHorario}</p>}
              </fieldset>

              <div className="campo">
                <label htmlFor={`${id}-nome`}>Nome do paciente</label>
                <input
                  id={`${id}-nome`}
                  type="text"
                  value={nome}
                  onChange={(e) => onNome(e.target.value)}
                  autoComplete="off"
                  aria-invalid={erroNome !== null}
                  aria-describedby={erroNome ? `${id}-erro-nome` : undefined}
                />
                {erroNome && (
                  <p id={`${id}-erro-nome`} className="campo__erro">
                    {erroNome}
                  </p>
                )}
              </div>

              <button type="submit" className="botao botao--primario" disabled={enviando}>
                {enviando ? 'Agendando…' : 'Agendar'}
              </button>
            </form>
          )}
        </>
      )}
    </PainelLateral>
  )
}
