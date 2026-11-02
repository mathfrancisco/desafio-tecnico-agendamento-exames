import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Agendamento, Exame, Medico } from '../../api/types'
import PainelAgendamento from './PainelAgendamento'

const agendamento: Agendamento = {
  id: 12,
  pacienteNome: 'Maria Silva',
  exameId: 20,
  medicoId: 1,
  inicio: '2026-11-03T08:00',
  fim: '2026-11-03T08:40',
  criadoEm: '2026-10-31T15:00:00.000Z',
}
const exame: Exame = { id: 20, nome: 'Ressonância Magnética de Crânio', duracaoMinutos: 40 }
const medico: Medico = { id: 1, nome: 'Dra. Helena Marques', crm: 'CRM-MG 11111', turnos: [] }

function json(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status }))
}

function renderizar(alvo: Agendamento = agendamento) {
  const onFechar = vi.fn()
  const onCancelado = vi.fn()
  render(
    <PainelAgendamento
      agendamento={alvo}
      exame={exame}
      medico={medico}
      onFechar={onFechar}
      onCancelado={onCancelado}
    />,
  )
  return { onFechar, onCancelado }
}

function pedirCancelamento() {
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar agendamento' }))
}

describe('PainelAgendamento', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-02T13:00:00Z')) // segunda, 10:00 na clínica
  })
  afterEach(() => vi.useRealTimers())

  it('mostra exame, médico, paciente, data e horário de início e fim', () => {
    renderizar()

    expect(screen.getByRole('dialog', { name: 'Ressonância Magnética de Crânio' })).toBeInTheDocument()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Dra. Helena Marques (CRM-MG 11111)')).toBeInTheDocument()
    expect(screen.getByText('terça-feira, 3 de novembro de 2026')).toBeInTheDocument()
    expect(screen.getByText('08:00–08:40')).toBeInTheDocument()
    expect(screen.getByText('40 min')).toBeInTheDocument()
  })

  it('exige confirmação: o primeiro clique só pergunta, sem chamar a API', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderizar()

    pedirCancelamento()

    expect(screen.getByText(/Cancelar o agendamento de/)).toHaveTextContent('Maria Silva')
    expect(screen.getByRole('button', { name: 'Sim, cancelar agendamento' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Manter agendamento' }))

    expect(screen.getByRole('button', { name: 'Cancelar agendamento' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('confirmar envia DELETE e avisa o pai ao receber 204', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubGlobal('fetch', fetchMock)
    const { onCancelado } = renderizar()

    pedirCancelamento()
    fireEvent.click(screen.getByRole('button', { name: 'Sim, cancelar agendamento' }))

    await waitFor(() => expect(onCancelado).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/agendamentos/12', { method: 'DELETE' })
  })

  it('desabilita os botões enquanto cancela', async () => {
    let concluir: (r: Response) => void = () => {}
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => (concluir = resolve))))
    const { onCancelado } = renderizar()

    pedirCancelamento()
    fireEvent.click(screen.getByRole('button', { name: 'Sim, cancelar agendamento' }))

    expect(await screen.findByRole('button', { name: 'Cancelando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Manter agendamento' })).toBeDisabled()
    concluir(new Response(null, { status: 204 }))
    await waitFor(() => expect(onCancelado).toHaveBeenCalled())
  })

  it('422: mostra a mensagem da API e não avisa o pai', async () => {
    const message = 'Não é possível cancelar um agendamento que já começou'
    vi.stubGlobal(
      'fetch',
      vi.fn(() => json({ statusCode: 422, error: 'Unprocessable Entity', message }, 422)),
    )
    const { onCancelado } = renderizar()

    pedirCancelamento()
    fireEvent.click(screen.getByRole('button', { name: 'Sim, cancelar agendamento' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(onCancelado).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Cancelar agendamento' })).toBeEnabled()
  })

  it('404 (outra pessoa já cancelou): avisa o pai, que fecha o painel e recarrega o mês', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        json({ statusCode: 404, error: 'Not Found', message: 'Agendamento 1 não encontrado' }, 404),
      ),
    )
    const { onCancelado } = renderizar()

    pedirCancelamento()
    fireEvent.click(screen.getByRole('button', { name: 'Sim, cancelar agendamento' }))

    await waitFor(() => expect(onCancelado).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('falha de rede mostra mensagem genérica', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    renderizar()

    pedirCancelamento()
    fireEvent.click(screen.getByRole('button', { name: 'Sim, cancelar agendamento' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/conectar ao servidor/)
  })

  it('fecha com Esc e pelo botão', () => {
    const { onFechar } = renderizar()

    fireEvent.keyDown(document.body, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Fechar painel' }))

    expect(onFechar).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['já realizado', '2026-10-30T08:00', '2026-10-30T08:40'],
    ['começa exatamente agora', '2026-11-02T10:00', '2026-11-02T10:40'],
  ])('exame %s não oferece cancelamento', (_caso, inicio, fim) => {
    renderizar({ ...agendamento, inicio, fim })

    expect(screen.queryByRole('button', { name: 'Cancelar agendamento' })).toBeNull()
    expect(screen.getByText(/já começou ou foi realizado/)).toBeInTheDocument()
  })

  it('usa texto neutro se exame ou médico não estiverem no catálogo', () => {
    render(<PainelAgendamento agendamento={agendamento} onFechar={vi.fn()} onCancelado={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Exame 20' })).toBeInTheDocument()
    expect(screen.getByText('Médico 1')).toBeInTheDocument()
  })
})
