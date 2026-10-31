import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

const exames = [{ id: 7, nome: 'Tomografia de Tórax', duracaoMinutos: 40 }]
const medicos = [
  {
    id: 1,
    nome: 'Dra. Helena Marques',
    crm: 'CRM-MG 11111',
    turnos: [{ dia: 'SEG', inicio: '08:00', fim: '12:00' }],
  },
]

function json(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status }))
}

function simularApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.startsWith('/api/exames')) return json(exames)
      if (url === '/api/medicos') return json(medicos)
      return json([])
    }),
  )
}

describe('App', () => {
  it('mostra topbar e sidebar com o item ativo destacado', async () => {
    simularApi()
    render(<App />)

    expect(screen.getByText('Agenda Imagem')).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar exame pelo nome')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agendar exame' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Agendamentos' })).not.toHaveAttribute('aria-current')
    expect(await screen.findByRole('heading', { level: 1, name: 'Agendar exame' })).toBeInTheDocument()
  })

  it('mostra carregando e depois erro com retry quando o catálogo falha', async () => {
    let falhar = true
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (falhar) return Promise.reject(new TypeError('Failed to fetch'))
        return json(url === '/api/medicos' ? medicos : exames)
      }),
    )
    render(<App />)

    expect(screen.getByText('Carregando médicos e exames…')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent(/conectar ao servidor/)
    falhar = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Agendar exame' })).toBeInTheDocument()
  })

  it('escolher um exame na busca mostra o exame na tela de agendar', async () => {
    simularApi()
    render(<App />)
    await screen.findByRole('heading', { level: 1, name: 'Agendar exame' })

    fireEvent.focus(screen.getByLabelText('Buscar exame pelo nome'))
    fireEvent.click(await screen.findByRole('button', { name: /Tomografia de Tórax/ }))

    expect(screen.getByText('Tomografia de Tórax')).toBeInTheDocument()
    expect(screen.getByText('40 min')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Helena Marques/ })).toBeInTheDocument()
  })
})
