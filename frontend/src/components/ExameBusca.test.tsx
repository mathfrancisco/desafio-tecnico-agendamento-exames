import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Exame } from '../api/types'
import ExameBusca from './ExameBusca'

const catalogo: Exame[] = [
  { id: 1, nome: 'Raio-X de Tórax', duracaoMinutos: 20 },
  { id: 20, nome: 'Ressonância Magnética de Crânio', duracaoMinutos: 40 },
]

function json(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status }))
}

describe('ExameBusca', () => {
  it('carrega o catálogo inteiro e permite selecionar um exame', async () => {
    const fetchMock = vi.fn(() => json(catalogo))
    vi.stubGlobal('fetch', fetchMock)
    const onSelecionar = vi.fn()
    render(<ExameBusca selecionado={null} onSelecionar={onSelecionar} />)

    expect(screen.getByText('Carregando exames…')).toBeInTheDocument()
    const botao = await screen.findByRole('button', { name: /Ressonância Magnética de Crânio/ })
    expect(botao).toHaveTextContent('40 min')
    expect(fetchMock).toHaveBeenCalledWith('/api/exames', undefined)

    fireEvent.click(botao)
    expect(onSelecionar).toHaveBeenCalledWith(catalogo[1])
  })

  it('marca o exame selecionado', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(catalogo)))
    render(<ExameBusca selecionado={catalogo[0]} onSelecionar={vi.fn()} />)

    expect(await screen.findByRole('button', { name: /Raio-X/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('busca pelo termo digitado depois do debounce de 300 ms', async () => {
    const fetchMock = vi.fn((url: string) =>
      json(url.includes('nome=') ? [catalogo[1]] : catalogo),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<ExameBusca selecionado={null} onSelecionar={vi.fn()} />)
    await screen.findByRole('button', { name: /Raio-X/ })

    fireEvent.change(screen.getByLabelText('Buscar exame pelo nome'), {
      target: { value: 'ressonancia' },
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenLastCalledWith('/api/exames?nome=ressonancia', undefined)
    await waitFor(() => expect(screen.queryByRole('button', { name: /Raio-X/ })).toBeNull())
    expect(screen.getByRole('button', { name: /Ressonância/ })).toBeInTheDocument()
  })

  it('mostra estado vazio quando nada é encontrado', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json([])))
    render(<ExameBusca selecionado={null} onSelecionar={vi.fn()} />)

    expect(await screen.findByText('Nenhum exame encontrado')).toBeInTheDocument()
  })

  it('mostra a mensagem de erro da API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => json({ statusCode: 500, error: 'Internal Server Error', message: 'Falha interna' }, 500)),
    )
    render(<ExameBusca selecionado={null} onSelecionar={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha interna')
  })

  it('mostra mensagem genérica em falha de rede', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    render(<ExameBusca selecionado={null} onSelecionar={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/conectar ao servidor/)
  })
})
