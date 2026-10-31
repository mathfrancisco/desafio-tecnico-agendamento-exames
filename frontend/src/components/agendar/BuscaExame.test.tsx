import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Exame } from '../../api/types'
import BuscaExame from './BuscaExame'

const catalogo: Exame[] = [
  { id: 1, nome: 'Raio-X de Tórax', duracaoMinutos: 20 },
  { id: 20, nome: 'Ressonância Magnética de Crânio', duracaoMinutos: 40 },
]

function json(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status }))
}

function abrir() {
  const campo = screen.getByLabelText('Buscar exame pelo nome')
  fireEvent.focus(campo)
  return campo
}

describe('BuscaExame', () => {
  it('não busca nada antes de o usuário focar o campo', () => {
    const fetchMock = vi.fn(() => json(catalogo))
    vi.stubGlobal('fetch', fetchMock)
    render(<BuscaExame onSelecionar={vi.fn()} />)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('mostra o catálogo com a duração e seleciona um exame', async () => {
    const fetchMock = vi.fn(() => json(catalogo))
    vi.stubGlobal('fetch', fetchMock)
    const onSelecionar = vi.fn()
    render(<BuscaExame onSelecionar={onSelecionar} />)

    abrir()
    expect(screen.getByText('Buscando exames…')).toBeInTheDocument()
    const opcao = await screen.findByRole('button', { name: /Ressonância Magnética de Crânio/ })
    expect(opcao).toHaveTextContent('40 min')
    expect(fetchMock).toHaveBeenCalledWith('/api/exames', undefined)

    fireEvent.click(opcao)

    expect(onSelecionar).toHaveBeenCalledWith(catalogo[1])
    expect(screen.queryByRole('button', { name: /Raio-X/ })).toBeNull()
  })

  it('busca pelo termo digitado só depois do debounce de 300 ms', async () => {
    const fetchMock = vi.fn((url: string) =>
      json(url.includes('nome=') ? [catalogo[1]] : catalogo),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<BuscaExame onSelecionar={vi.fn()} />)
    const campo = abrir()
    await screen.findByRole('button', { name: /Raio-X/ })

    fireEvent.change(campo, { target: { value: 'ressonancia' } })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenLastCalledWith('/api/exames?nome=ressonancia', undefined)
    await waitFor(() => expect(screen.queryByRole('button', { name: /Raio-X/ })).toBeNull())
    expect(screen.getByRole('button', { name: /Ressonância/ })).toBeInTheDocument()
  })

  it('Esc fecha a lista', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(catalogo)))
    render(<BuscaExame onSelecionar={vi.fn()} />)
    const campo = abrir()
    await screen.findByRole('button', { name: /Raio-X/ })

    fireEvent.keyDown(campo, { key: 'Escape' })

    expect(screen.queryByRole('button', { name: /Raio-X/ })).toBeNull()
  })

  it('mostra estado vazio quando nada é encontrado', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json([])))
    render(<BuscaExame onSelecionar={vi.fn()} />)
    abrir()

    expect(await screen.findByText('Nenhum exame encontrado')).toBeInTheDocument()
  })

  it('mostra a mensagem da API e permite tentar de novo', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        json({ statusCode: 500, error: 'Internal Server Error', message: 'Falha interna' }, 500),
      )
      .mockImplementation(() => json(catalogo))
    vi.stubGlobal('fetch', fetchMock)
    render(<BuscaExame onSelecionar={vi.fn()} />)
    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha interna')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('button', { name: /Raio-X/ })).toBeInTheDocument()
  })

  it('mostra mensagem genérica em falha de rede', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    render(<BuscaExame onSelecionar={vi.fn()} />)
    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent(/conectar ao servidor/)
  })
})
