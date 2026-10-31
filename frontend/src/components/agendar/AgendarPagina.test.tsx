import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Agendamento, Exame, Medico } from '../../api/types'
import { diasDoMes } from '../../utils/datas'
import AgendarPagina from './AgendarPagina'

const exame: Exame = { id: 20, nome: 'Ressonância Magnética de Crânio', duracaoMinutos: 40 }
const exames: Exame[] = [exame, { id: 1, nome: 'Raio-X de Tórax', duracaoMinutos: 20 }]
const medicos: Medico[] = [
  {
    id: 1,
    nome: 'Dra. Helena Marques',
    crm: 'CRM-MG 11111',
    turnos: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'].map((dia) => ({
      dia: dia as 'SEG',
      inicio: '08:00',
      fim: '12:00',
    })),
  },
  {
    id: 4,
    nome: 'Dr. Thiago Fontes',
    crm: 'CRM-MG 44444',
    turnos: [{ dia: 'TER', inicio: '08:00', fim: '12:00' }],
  },
]

function marcado(id: number, inicio: string, paciente: string, exameId = 1): Agendamento {
  return {
    id,
    pacienteNome: paciente,
    exameId,
    medicoId: 1,
    inicio: `2026-11-${inicio.slice(0, 2)}T${inicio.slice(3)}`,
    fim: `2026-11-${inicio.slice(0, 2)}T10:00`,
    criadoEm: '2026-10-31T15:00:00.000Z',
  }
}

const agendamentos: Agendamento[] = [
  marcado(1, '03 09:00', 'Maria Silva'),
  marcado(2, '04 08:00', 'Ana Souza'),
  marcado(3, '04 08:40', 'Bruno Lima'),
  marcado(4, '04 09:20', 'Carla Dias'),
]

/** Livres por dia: 01 passado (a API diria 0, mas aqui vem 7), 02 hoje, 03 e 04 com vagas. */
const livresPorDia: Record<string, number> = {
  '2026-11-01': 7,
  '2026-11-02': 5,
  '2026-11-03': 12,
  '2026-11-04': 1,
}

function disponibilidade(mes: string) {
  return {
    medicoId: 1,
    exameId: 20,
    mes,
    dias: diasDoMes(mes).map((data) => ({ data, livres: livresPorDia[data] ?? 0 })),
  }
}

function json(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status }))
}

function simularApi() {
  const fetchMock = vi.fn((url: string) => {
    if (url.startsWith('/api/medicos/1/disponibilidade?')) {
      return json(disponibilidade(new URL(url, 'http://x').searchParams.get('mes')!))
    }
    if (url.startsWith('/api/agendamentos?')) return json(agendamentos)
    return Promise.reject(new Error(`URL inesperada: ${url}`))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderizar(exameEscolhido: Exame | null = exame) {
  return render(<AgendarPagina exame={exameEscolhido} medicos={medicos} exames={exames} />)
}

describe('AgendarPagina', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 2, 10, 0)) // segunda, 02/11/2026
  })
  afterEach(() => vi.useRealTimers())

  it('sem exame, pede para buscar e não consulta a API', () => {
    const fetchMock = simularApi()
    renderizar(null)

    expect(screen.getByText(/Nenhum exame selecionado/)).toBeInTheDocument()
    expect(screen.getByText('Novembro de 2026')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /horário/ })).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('mostra o exame escolhido com a duração e os dias de atendimento de cada médico', () => {
    simularApi()
    renderizar()

    expect(screen.getByText('Ressonância Magnética de Crânio')).toBeInTheDocument()
    expect(screen.getByText('40 min')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Helena Marques/ })).toHaveTextContent('Seg a Sex')
    expect(screen.getByRole('button', { name: /Thiago Fontes/ })).toHaveAttribute(
      'title',
      'Atende: Ter',
    )
    expect(screen.getByText(/Escolha um médico/)).toBeInTheDocument()
  })

  it('exame + médico: mostra horários livres por dia e os exames já marcados', async () => {
    const fetchMock = simularApi()
    renderizar()

    fireEvent.click(screen.getByRole('button', { name: /Helena Marques/ }))

    expect(await screen.findByText('12 horários livres')).toBeInTheDocument()
    expect(screen.getByText('1 horário livre')).toBeInTheDocument()
    expect(screen.getByText('5 horários livres')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/medicos/1/disponibilidade?mes=2026-11&exameId=20',
      undefined,
    )
    expect(fetchMock).toHaveBeenCalledWith('/api/agendamentos?mes=2026-11&medicoId=1', undefined)

    // exame já marcado aparece como cartão no dia certo
    expect(await screen.findByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getAllByText('Raio-X de Tórax').length).toBeGreaterThan(0)
    // dia 04 tem 3 marcados e o limite é 2
    expect(screen.getByText('+1 mais')).toBeInTheDocument()
  })

  it('dias passados e sem vaga ficam apagados e sem botão; os demais abrem', async () => {
    simularApi()
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: /Helena Marques/ }))
    await screen.findByText('12 horários livres')

    expect(screen.getByRole('button', { name: '3 de novembro, 12 horários livres' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '2 de novembro, 5 horários livres' })).toBeEnabled()
    // 1º: passado (mesmo com livres > 0); 5º: livres = 0
    expect(screen.queryByRole('button', { name: /^1 de novembro/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^5 de novembro/ })).toBeNull()
    expect(screen.getByText('domingo, 1 de novembro de 2026').closest('li')).toHaveClass(
      'dia--apagado',
    )
    expect(screen.getByText('quinta-feira, 5 de novembro de 2026').closest('li')).toHaveClass(
      'dia--apagado',
    )
    expect(screen.getByText('terça-feira, 3 de novembro de 2026').closest('li')).not.toHaveClass(
      'dia--apagado',
    )
    // hoje destacado
    expect(screen.getByText('segunda-feira, 2 de novembro de 2026').closest('li')).toHaveAttribute(
      'aria-current',
      'date',
    )
  })

  it('navega entre meses refazendo a consulta e não deixa voltar antes de hoje', async () => {
    const fetchMock = simularApi()
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: /Helena Marques/ }))
    await screen.findByText('12 horários livres')
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))

    expect(screen.getByText('Dezembro de 2026')).toBeInTheDocument()
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/medicos/1/disponibilidade?mes=2026-12&exameId=20',
        undefined,
      ),
    )
    expect(await screen.findByText(/Nenhum horário livre em Dezembro de 2026/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeEnabled()
  })

  it('mostra a mensagem da API e tenta de novo', async () => {
    let falhar = true
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/disponibilidade')) {
          return falhar
            ? json({ statusCode: 404, error: 'Not Found', message: 'Exame não encontrado' }, 404)
            : json(disponibilidade('2026-11'))
        }
        return json([])
      }),
    )
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: /Helena Marques/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Exame não encontrado')
    falhar = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('12 horários livres')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
