import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Agendamento, Exame, Medico } from '../api/types'
import AgendamentoForm from './AgendamentoForm'

const exame: Exame = { id: 7, nome: 'Tomografia', duracaoMinutos: 40 }
const medico: Medico = { id: 1, nome: 'Dra. Helena Marques', crm: 'CRM-MG 11111', turnos: [] }
const criado: Agendamento = {
  id: 1,
  pacienteNome: 'Maria Silva',
  exameId: 7,
  medicoId: 1,
  inicio: '2026-11-03T08:00',
  fim: '2026-11-03T08:40',
  criadoEm: '2026-10-31T15:00:00.000Z',
}

function renderizar(onCriado = vi.fn(), onConflito = vi.fn()) {
  render(
    <AgendamentoForm
      exame={exame}
      medico={medico}
      data="2026-11-03"
      horario={{ inicio: '08:00', fim: '08:40' }}
      onCriado={onCriado}
      onConflito={onConflito}
    />,
  )
  return { onCriado, onConflito }
}

function digitarNome(valor: string) {
  fireEvent.change(screen.getByLabelText('Nome do paciente'), { target: { value: valor } })
}

describe('AgendamentoForm', () => {
  it('mostra o resumo das escolhas', () => {
    renderizar()

    expect(screen.getByText('Tomografia (40 min)')).toBeInTheDocument()
    expect(screen.getByText('Dra. Helena Marques')).toBeInTheDocument()
    expect(screen.getByText('03/11/2026')).toBeInTheDocument()
    expect(screen.getByText('08:00–08:40')).toBeInTheDocument()
  })

  it.each([
    ['', 'Informe o nome do paciente.'],
    ['   ', 'Informe o nome do paciente.'],
    ['ab', 'O nome deve ter pelo menos 3 caracteres.'],
    [' a  ', 'O nome deve ter pelo menos 3 caracteres.'],
    ['x'.repeat(101), 'O nome deve ter no máximo 100 caracteres.'],
  ])('rejeita nome inválido %j sem chamar a API', (valor, mensagem) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderizar()

    digitarNome(valor)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))

    expect(screen.getByText(mensagem)).toBeInTheDocument()
    expect(screen.getByLabelText('Nome do paciente')).toBeInvalid()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('valida ao sair do campo', () => {
    renderizar()

    digitarNome('ab')
    fireEvent.blur(screen.getByLabelText('Nome do paciente'))

    expect(screen.getByText('O nome deve ter pelo menos 3 caracteres.')).toBeInTheDocument()
  })

  it('envia o nome sem espaços nas pontas e desabilita o botão durante o envio', async () => {
    let resolver!: (r: Response) => void
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (resolver = resolve)))
    vi.stubGlobal('fetch', fetchMock)
    const { onCriado } = renderizar()

    digitarNome('  Maria Silva  ')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))

    const botao = await screen.findByRole('button', { name: 'Agendando…' })
    expect(botao).toBeDisabled()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/agendamentos')
    expect(JSON.parse(init.body as string)).toEqual({
      pacienteNome: 'Maria Silva',
      exameId: 7,
      medicoId: 1,
      inicio: '2026-11-03T08:00',
    })

    resolver(new Response(JSON.stringify(criado), { status: 201 }))
    await waitFor(() => expect(onCriado).toHaveBeenCalledWith(criado))
  })

  describe('erros do envio', () => {
    function enviarComResposta(resposta: () => Promise<Response>) {
      vi.stubGlobal('fetch', vi.fn(resposta))
      const callbacks = renderizar()
      digitarNome('Maria Silva')
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))
      return callbacks
    }

    it('409 avisa o pai para recarregar os horários', async () => {
      const { onCriado, onConflito } = enviarComResposta(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ statusCode: 409, error: 'Conflict', message: 'Horário ocupado' }),
            { status: 409 },
          ),
        ),
      )

      await waitFor(() =>
        expect(onConflito).toHaveBeenCalledWith(expect.stringMatching(/acabou de ser ocupado/)),
      )
      expect(onCriado).not.toHaveBeenCalled()
    })

    it.each([
      [400, ['nome muito curto', 'inicio inválido'], 'nome muito curto; inicio inválido'],
      [404, 'Médico não encontrado', 'Médico não encontrado'],
      [422, 'Horário no passado', 'Horário no passado'],
    ])('%i mostra a mensagem da API e reabilita o botão', async (status, message, esperado) => {
      const { onConflito } = enviarComResposta(() =>
        Promise.resolve(new Response(JSON.stringify({ statusCode: status, error: 'x', message }), { status })),
      )

      expect(await screen.findByRole('alert')).toHaveTextContent(esperado)
      expect(screen.getByRole('button', { name: 'Confirmar agendamento' })).toBeEnabled()
      expect(onConflito).not.toHaveBeenCalled()
    })

    it('falha de rede mostra mensagem genérica', async () => {
      enviarComResposta(() => Promise.reject(new TypeError('Failed to fetch')))

      expect(await screen.findByRole('alert')).toHaveTextContent(/conectar ao servidor/)
    })
  })
})
