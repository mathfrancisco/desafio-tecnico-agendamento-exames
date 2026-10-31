import { useId, useState, type FormEvent } from 'react'
import { ApiError, criarAgendamento, mensagemDeErro } from '../api/client'
import type { Agendamento, Exame, Horario, Medico } from '../api/types'
import { formatarData } from '../datas'

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
  data: string
  horario: Horario
  onCriado: (agendamento: Agendamento) => void
  /** Horário ocupado (409): o pai recarrega os horários e limpa a seleção. */
  onConflito: (aviso: string) => void
}

export default function AgendamentoForm({
  exame,
  medico,
  data,
  horario,
  onCriado,
  onConflito,
}: Props) {
  const id = useId()
  const [nome, setNome] = useState('')
  const [tocado, setTocado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const erroNome = tocado ? validarNome(nome) : null

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTocado(true)
    if (validarNome(nome) !== null) return

    setEnviando(true)
    setErroEnvio(null)
    try {
      const agendamento = await criarAgendamento({
        pacienteNome: nome.trim(),
        exameId: exame.id,
        medicoId: medico.id,
        inicio: `${data}T${horario.inicio}`,
      })
      onCriado(agendamento)
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 409) {
        onConflito(AVISO_CONFLITO)
      } else {
        setErroEnvio(mensagemDeErro(erro))
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="etapa" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>4. Confirmar agendamento</h2>
      <dl className="resumo">
        <dt>Exame</dt>
        <dd>
          {exame.nome} ({exame.duracaoMinutos} min)
        </dd>
        <dt>Médico</dt>
        <dd>{medico.nome}</dd>
        <dt>Data</dt>
        <dd>{formatarData(data)}</dd>
        <dt>Horário</dt>
        <dd>
          {horario.inicio}–{horario.fim}
        </dd>
      </dl>

      <form onSubmit={enviar} noValidate>
        <label htmlFor={`${id}-nome`}>Nome do paciente</label>
        <input
          id={`${id}-nome`}
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => setTocado(true)}
          autoComplete="name"
          aria-invalid={erroNome !== null}
          aria-describedby={erroNome ? `${id}-erro-nome` : undefined}
        />
        {erroNome && (
          <p id={`${id}-erro-nome`} className="erro">
            {erroNome}
          </p>
        )}

        {erroEnvio && (
          <p className="erro" role="alert">
            {erroEnvio}
          </p>
        )}

        <button type="submit" className="primario" disabled={enviando}>
          {enviando ? 'Agendando…' : 'Confirmar agendamento'}
        </button>
      </form>
    </section>
  )
}
