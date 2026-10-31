import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Agendamento, Exame, Medico } from '../../api/types'
import AgendamentosPagina from './AgendamentosPagina'

const exames: Exame[] = [
  { id: 1, nome: 'Raio-X de Tórax', duracaoMinutos: 20 },
  { id: 20, nome: 'Ressonância Magnética de Crânio', duracaoMinutos: 40 },
]
const medicos: Medico[] = [
  { id: 1, nome: 'Dra. Helena Marques', crm: 'CRM-MG 11111', turnos: [] },
  { id: 4, nome: 'Dr. Thiago Fontes', crm: 'CRM-MG 44444', turnos: [] },
]

function agendamento(
  id: number,
  inicio: string,
  paciente: string,
  exameId: number,
  medicoId: number,
): Agendamento {
  return {
    id,
    pacienteNome: paciente,
    exameId,
    medicoId,
    inicio,
    fim: inicio.slice(0, 11) + '10:00',
    criadoEm: '2026-10-31T15:00:00.000Z',
  }
}

const doMes: Agendamento[] = [
  agendamento(1, '2026-11-03T08:00', 'Maria Silva', 1, 1),
  agendamento(2, '2026-11-03T09:00', 'João Pereira', 20, 4),
  agendamento(3, '2026-11-10T14:00', 'Ana Souza', 20, 1),
]

function json(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status }))
}

function simularApi(lista: Agendamento[] = doMes) {
  const fetchMock = vi.fn((url: string) => {
    if (url.startsWith('/api/agendamentos?')) {
      const parametros = new URL(url, 'http://x').searchParams
      const medicoId = parametros.get('medicoId')
      const mes = parametros.get('mes')!
      return json(
        lista.filter(
          (a) => a.inicio.startsWith(mes) && (medicoId === null || a.medicoId === Number(medicoId)),
        ),
      )
    }
    return Promise.reject(new Error(`URL inesperada: ${url}`))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderizar() {
  return render(<AgendamentosPagina medicos={medicos} exames={exames} />)
}

describe('AgendamentosPagina', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-02T13:00:00Z')) // 10:00 na clínica
  })
  afterEach(() => vi.useRealTimers())

  it('carrega o mês e mostra cada exame marcado no seu dia, com a cor da modalidade', async () => {
    const fetchMock = simularApi()
    renderizar()

    expect(screen.getByText('Carregando agendamentos…')).toBeInTheDocument()
    const dia3 = (await screen.findByText('terça-feira, 3 de novembro de 2026')).closest('li')!
    expect(within(dia3).getByRole('button', { name: 'Raio-X de Tórax, Maria Silva, 08:00' })).toBeInTheDocument()
    expect(
      within(dia3).getByRole('button', { name: 'Ressonância Magnética de Crânio, João Pereira, 09:00' }),
    ).toBeInTheDocument()
    const dia10 = screen.getByText('terça-feira, 10 de novembro de 2026').closest('li')!
    expect(within(dia10).getByText('Ana Souza')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/agendamentos?mes=2026-11', undefined)
    expect(within(dia3).getByText('Raio-X de Tórax').closest('.evento')).toHaveStyle({
      '--mod-cor': '#0284c7',
    })
    expect(screen.queryByText(/Carregando agendamentos/)).toBeNull()
  })

  it('filtra por médico e volta para "Todos"', async () => {
    const fetchMock = simularApi()
    renderizar()
    await screen.findByText('João Pereira')
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Dra. Helena Marques' }))

    await waitFor(() => expect(screen.queryByText('João Pereira')).toBeNull())
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith('/api/agendamentos?mes=2026-11&medicoId=1', undefined)
    expect(screen.getByRole('button', { name: 'Dra. Helena Marques' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Todos' }))

    expect(await screen.findByText('João Pereira')).toBeInTheDocument()
  })

  it('mês sem agendamentos mostra estado vazio; filtro entra na mensagem', async () => {
    simularApi()
    renderizar()
    await screen.findByText('Maria Silva')

    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))

    expect(await screen.findByText('Nenhum agendamento em Dezembro de 2026.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dr. Thiago Fontes' }))

    expect(
      await screen.findByText('Nenhum agendamento em Dezembro de 2026 para Dr. Thiago Fontes.'),
    ).toBeInTheDocument()
  })

  it('permite voltar a meses passados (histórico)', async () => {
    const fetchMock = simularApi()
    renderizar()
    await screen.findByText('Maria Silva')

    fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith('/api/agendamentos?mes=2026-10', undefined),
    )
    expect(await screen.findByText(/Nenhum agendamento em Outubro de 2026/)).toBeInTheDocument()
  })

  it('mostra a mensagem da API em erro e carrega ao tentar de novo', async () => {
    let falhar = true
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        falhar
          ? json({ statusCode: 400, error: 'Bad Request', message: ['mes inválido'] }, 400)
          : json(doMes),
      ),
    )
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('mes inválido')
    falhar = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('"+N mais" expande os exames de um dia cheio', async () => {
    const cheio = [1, 2, 3, 4, 5].map((n) =>
      agendamento(n, `2026-11-03T0${n}:00`, `Paciente ${n}`, 1, 1),
    )
    simularApi(cheio)
    renderizar()

    await screen.findByText('Paciente 1')
    expect(screen.queryByText('Paciente 4')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '+2 mais' }))

    expect(screen.getByText('Paciente 5')).toBeInTheDocument()
  })

  it('clicar num exame abre o painel; cancelar remove o exame do calendário', async () => {
    let lista = [...doMes]
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        lista = lista.filter((a) => a.id !== 1)
        return Promise.resolve(new Response(null, { status: 204 }))
      }
      return json(lista)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderizar()

    fireEvent.click(await screen.findByRole('button', { name: 'Raio-X de Tórax, Maria Silva, 08:00' }))

    const painel = screen.getByRole('dialog', { name: 'Raio-X de Tórax' })
    expect(within(painel).getByText('Dra. Helena Marques (CRM-MG 11111)')).toBeInTheDocument()
    fireEvent.click(within(painel).getByRole('button', { name: 'Cancelar agendamento' }))
    fireEvent.click(within(painel).getByRole('button', { name: 'Sim, cancelar agendamento' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.queryByText('Maria Silva')).toBeNull())
    expect(fetchMock).toHaveBeenCalledWith('/api/agendamentos/1', { method: 'DELETE' })
    expect(screen.getByText('João Pereira')).toBeInTheDocument()
  })

  it('trocar o filtro fecha o painel aberto', async () => {
    simularApi()
    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Raio-X de Tórax, Maria Silva, 08:00' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dr. Thiago Fontes' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    await screen.findByText('João Pereira')
  })
})
