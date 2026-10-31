import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Exame, Medico } from '../api/types'
import HorariosLista from './HorariosLista'

const exame: Exame = { id: 7, nome: 'Tomografia', duracaoMinutos: 40 }
const medico: Medico = { id: 1, nome: 'Dra. Helena Marques', crm: 'CRM-MG 11111', turnos: [] }

function renderizar(selecionado = null as { inicio: string; fim: string } | null, onSelecionar = vi.fn()) {
  render(
    <HorariosLista
      exame={exame}
      medico={medico}
      data="2026-11-03"
      versao={0}
      selecionado={selecionado}
      onSelecionar={onSelecionar}
    />,
  )
  return onSelecionar
}

function json(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status }))
}

describe('HorariosLista', () => {
  it('mostra carregando e depois a grade de horários; clique seleciona', async () => {
    const fetchMock = vi.fn(() =>
      json({
        medicoId: 1,
        exameId: 7,
        data: '2026-11-03',
        horarios: [
          { inicio: '08:00', fim: '08:40' },
          { inicio: '08:40', fim: '09:20' },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const onSelecionar = renderizar()

    expect(screen.getByText('Carregando horários…')).toBeInTheDocument()
    const botao = await screen.findByRole('button', { name: '08:40–09:20' })
    expect(screen.getByRole('button', { name: '08:00–08:40' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/medicos/1/horarios?data=2026-11-03&exameId=7',
      undefined,
    )

    fireEvent.click(botao)
    expect(onSelecionar).toHaveBeenCalledWith({ inicio: '08:40', fim: '09:20' })
  })

  it('marca o horário selecionado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => json({ medicoId: 1, exameId: 7, data: '2026-11-03', horarios: [{ inicio: '08:00', fim: '08:40' }] })),
    )
    renderizar({ inicio: '08:00', fim: '08:40' })

    expect(await screen.findByRole('button', { name: '08:00–08:40' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('explica o estado vazio', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => json({ medicoId: 1, exameId: 7, data: '2026-11-03', horarios: [] })),
    )
    renderizar()

    expect(await screen.findByText(/Nenhum horário disponível/)).toHaveTextContent(
      /não atender neste dia.*ocupados.*já passaram/,
    )
  })

  it('mostra a mensagem da API em caso de erro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => json({ statusCode: 404, error: 'Not Found', message: 'Médico não encontrado' }, 404)),
    )
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Médico não encontrado')
  })

  it('refaz a consulta quando a versão muda', async () => {
    const fetchMock = vi.fn(() => json({ medicoId: 1, exameId: 7, data: '2026-11-03', horarios: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const props = { exame, medico, data: '2026-11-03', selecionado: null, onSelecionar: vi.fn() }
    const { rerender } = render(<HorariosLista {...props} versao={0} />)
    await screen.findByText(/Nenhum horário disponível/)

    rerender(<HorariosLista {...props} versao={1} />)

    expect(screen.getByText('Carregando horários…')).toBeInTheDocument()
    await screen.findByText(/Nenhum horário disponível/)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
