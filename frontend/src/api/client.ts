import type {
  Agendamento,
  Disponibilidade,
  Exame,
  HorariosDoDia,
  Medico,
  NovoAgendamento,
} from './types'

const MENSAGEM_REDE =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Mensagem pronta para o usuário, para qualquer erro capturado. */
export function mensagemDeErro(erro: unknown): string {
  return erro instanceof ApiError
    ? erro.message
    : 'Ocorreu um erro inesperado. Tente novamente.'
}

async function lerMensagem(resposta: Response): Promise<string> {
  try {
    const corpo = await resposta.json()
    const message = corpo?.message
    if (Array.isArray(message) && message.length > 0) return message.join('; ')
    if (typeof message === 'string' && message) return message
  } catch {
    // corpo ausente ou que não é JSON: cai na mensagem genérica abaixo
  }
  return `Erro inesperado do servidor (${resposta.status}).`
}

async function requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`/api${caminho}`, init)
  } catch {
    throw new ApiError(0, MENSAGEM_REDE)
  }
  if (!resposta.ok) {
    throw new ApiError(resposta.status, await lerMensagem(resposta))
  }
  if (resposta.status === 204) return undefined as T
  return (await resposta.json()) as T
}

export function buscarExames(nome = ''): Promise<Exame[]> {
  const termo = nome.trim()
  const consulta = termo ? `?${new URLSearchParams({ nome: termo })}` : ''
  return requisitar<Exame[]>(`/exames${consulta}`)
}

export function listarMedicos(): Promise<Medico[]> {
  return requisitar<Medico[]>('/medicos')
}

export function buscarHorarios(
  medicoId: number,
  exameId: number,
  data: string,
): Promise<HorariosDoDia> {
  const consulta = new URLSearchParams({ data, exameId: String(exameId) })
  return requisitar<HorariosDoDia>(`/medicos/${medicoId}/horarios?${consulta}`)
}

export function buscarDisponibilidade(
  medicoId: number,
  exameId: number,
  mes: string,
): Promise<Disponibilidade> {
  const consulta = new URLSearchParams({ mes, exameId: String(exameId) })
  return requisitar<Disponibilidade>(`/medicos/${medicoId}/disponibilidade?${consulta}`)
}

/** Agendamentos do mês (`YYYY-MM`), opcionalmente de um único médico. */
export function listarAgendamentos(mes: string, medicoId?: number): Promise<Agendamento[]> {
  const consulta = new URLSearchParams({ mes })
  if (medicoId !== undefined) consulta.set('medicoId', String(medicoId))
  return requisitar<Agendamento[]>(`/agendamentos?${consulta}`)
}

export function cancelarAgendamento(id: number): Promise<void> {
  return requisitar<void>(`/agendamentos/${id}`, { method: 'DELETE' })
}

export function criarAgendamento(dados: NovoAgendamento): Promise<Agendamento> {
  return requisitar<Agendamento>('/agendamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })
}
