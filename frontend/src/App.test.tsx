import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

const exames = [{ id: 7, nome: 'Tomografia de Tórax', duracaoMinutos: 40 }]

function json(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status }))
}

describe('App', () => {
  it('mostra topbar e sidebar com o item ativo destacado', () => {
    vi.stubGlobal('fetch', vi.fn(() => json(exames)))
    render(<App />)

    expect(screen.getByText('Agenda Imagem')).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar exame pelo nome')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agendar exame' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Agendamentos' })).not.toHaveAttribute('aria-current')
  })

  it('troca de tela pela sidebar', () => {
    vi.stubGlobal('fetch', vi.fn(() => json(exames)))
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Agendamentos' }))

    expect(screen.getByRole('button', { name: 'Agendamentos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Agendamentos' })).toBeInTheDocument()
  })

  it('escolher um exame na busca leva para a tela de agendar', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(exames)))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Agendamentos' }))

    fireEvent.focus(screen.getByLabelText('Buscar exame pelo nome'))
    fireEvent.click(await screen.findByRole('button', { name: /Tomografia de Tórax/ }))

    expect(screen.getByRole('heading', { level: 1, name: 'Agendar exame' })).toBeInTheDocument()
    expect(screen.getByText('Tomografia de Tórax')).toBeInTheDocument()
  })
})
