import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Confirmacao from './Confirmacao'

describe('Confirmacao', () => {
  it('mostra o resumo e reinicia o fluxo', () => {
    const onNovo = vi.fn()
    render(
      <Confirmacao
        agendamento={{
          id: 1,
          pacienteNome: 'Maria Silva',
          exameId: 7,
          medicoId: 1,
          inicio: '2026-11-03T09:20',
          fim: '2026-11-03T10:00',
          criadoEm: '2026-10-31T15:00:00.000Z',
        }}
        exame={{ id: 7, nome: 'Tomografia', duracaoMinutos: 40 }}
        medico={{ id: 1, nome: 'Dra. Helena Marques', crm: 'CRM-MG 11111', turnos: [] }}
        onNovo={onNovo}
      />,
    )

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Tomografia')).toBeInTheDocument()
    expect(screen.getByText('Dra. Helena Marques')).toBeInTheDocument()
    expect(screen.getByText('03/11/2026')).toBeInTheDocument()
    expect(screen.getByText('09:20–10:00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Novo agendamento' }))
    expect(onNovo).toHaveBeenCalled()
  })
})
