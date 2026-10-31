import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

const exames = [{ id: 7, nome: 'Tomografia', duracaoMinutos: 40 }]
const medicos = [
  {
    id: 1,
    nome: 'Dra. Helena Marques',
    crm: 'CRM-MG 11111',
    turnos: [{ dia: 'SEG', inicio: '08:00', fim: '12:00' }],
  },
]
const dois = [
  { inicio: '08:00', fim: '08:40' },
  { inicio: '08:40', fim: '09:20' },
]
const apenasUm = [{ inicio: '08:40', fim: '09:20' }]

function json(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status }))
}

/** Simula a API; `horarios` devolve a lista de cada consulta, em ordem. */
function simularApi(opcoes: { horarios: unknown[][]; post: () => Promise<Response> }) {
  let consultas = 0
  const fetchMock = vi.fn((url: string) => {
    if (url.startsWith('/api/exames')) return json(exames)
    if (url === '/api/medicos') return json(medicos)
    if (url.includes('/horarios')) {
      const lista = opcoes.horarios[Math.min(consultas++, opcoes.horarios.length - 1)]
      return json({ medicoId: 1, exameId: 7, data: '2030-01-14', horarios: lista })
    }
    if (url === '/api/agendamentos') return opcoes.post()
    return Promise.reject(new Error(`URL inesperada: ${url}`))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function consultasDeHorarios(fetchMock: ReturnType<typeof simularApi>) {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes('/horarios')).length
}

async function escolherAteHorarios() {
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: /Tomografia/ }))
  fireEvent.click(await screen.findByRole('radio', { name: /Helena/ }))
  fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2030-01-14' } })
}

async function confirmarComoMaria() {
  fireEvent.change(await screen.findByLabelText('Nome do paciente'), {
    target: { value: 'Maria Silva' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))
}

describe('App', () => {
  it('habilita as etapas em sequência e conclui o agendamento', async () => {
    simularApi({
      horarios: [dois],
      post: () =>
        json(
          {
            id: 1,
            pacienteNome: 'Maria Silva',
            exameId: 7,
            medicoId: 1,
            inicio: '2030-01-14T08:00',
            fim: '2030-01-14T08:40',
            criadoEm: '2030-01-01T00:00:00.000Z',
          },
          201,
        ),
    })
    render(<App />)
    expect(await screen.findByRole('button', { name: /Tomografia/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Data')).toBeDisabled()
    expect(screen.getByText('Escolha exame, médico e data para ver os horários.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Tomografia/ }))
    fireEvent.click(await screen.findByRole('radio', { name: /Helena/ }))
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2030-01-14' } })
    fireEvent.click(await screen.findByRole('button', { name: '08:00–08:40' }))
    await confirmarComoMaria()

    expect(await screen.findByText('Agendamento confirmado')).toBeInTheDocument()
    expect(screen.getByText('14/01/2030')).toBeInTheDocument()
    expect(screen.getByText('08:00–08:40')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Novo agendamento' }))
    expect(await screen.findByLabelText('Buscar exame pelo nome')).toBeInTheDocument()
    expect(screen.getByLabelText('Data')).toBeDisabled()
  })

  it('mudar a data limpa o horário escolhido e o formulário', async () => {
    simularApi({ horarios: [dois], post: () => json({}) })
    await escolherAteHorarios()
    fireEvent.click(await screen.findByRole('button', { name: '08:00–08:40' }))
    expect(screen.getByLabelText('Nome do paciente')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2030-01-15' } })

    await waitFor(() => expect(screen.queryByLabelText('Nome do paciente')).toBeNull())
  })

  it('409: avisa, recarrega os horários e limpa o horário escolhido', async () => {
    const fetchMock = simularApi({
      horarios: [dois, apenasUm],
      post: () =>
        json({ statusCode: 409, error: 'Conflict', message: 'Horário já ocupado' }, 409),
    })
    await escolherAteHorarios()
    fireEvent.click(await screen.findByRole('button', { name: '08:00–08:40' }))
    expect(consultasDeHorarios(fetchMock)).toBe(1)

    await confirmarComoMaria()

    expect(await screen.findByRole('alert')).toHaveTextContent(/acabou de ser ocupado/)
    await waitFor(() => expect(consultasDeHorarios(fetchMock)).toBe(2))
    // lista recarregada: o horário tomado sumiu e nada continua selecionado
    expect(await screen.findByRole('button', { name: '08:40–09:20' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.queryByRole('button', { name: '08:00–08:40' })).toBeNull()
    expect(screen.queryByLabelText('Nome do paciente')).toBeNull()
  })

  it('422: mostra a mensagem da API no formulário e mantém a escolha', async () => {
    simularApi({
      horarios: [dois],
      post: () =>
        json({ statusCode: 422, error: 'Unprocessable Entity', message: 'Horário no passado' }, 422),
    })
    await escolherAteHorarios()
    fireEvent.click(await screen.findByRole('button', { name: '08:00–08:40' }))

    await confirmarComoMaria()

    expect(await screen.findByRole('alert')).toHaveTextContent('Horário no passado')
    expect(screen.getByLabelText('Nome do paciente')).toHaveValue('Maria Silva')
  })
})
