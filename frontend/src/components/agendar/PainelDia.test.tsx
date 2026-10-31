import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Exame, Medico } from '../../api/types'
import PainelDia from './PainelDia'

const exame: Exame = { id: 7, nome: 'Ultrassonografia Abdominal Total', duracaoMinutos: 40 }
const medico: Medico = {
  id: 1,
  nome: 'Dra. Helena Marques',
  crm: 'CRM-MG 11111',
  turnos: [{ dia: 'TER', inicio: '08:00', fim: '12:00' }],
}
const dois = [
  { inicio: '08:00', fim: '08:40' },
  { inicio: '08:40', fim: '09:20' },
]
const apenasUm = [{ inicio: '08:40', fim: '09:20' }]

function json(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status }))
}

function criado(nome = 'Maria Silva') {
  return {
    id: 1,
    pacienteNome: nome,
    exameId: 7,
    medicoId: 1,
    inicio: '2026-11-03T08:00',
    fim: '2026-11-03T08:40',
    criadoEm: '2026-10-31T15:00:00.000Z',
  }
}

/** `horarios` devolve a lista de cada consulta GET, em ordem (a última se repete). */
function simularApi(opcoes: { horarios?: unknown[][]; post?: () => Promise<Response> } = {}) {
  const listas = opcoes.horarios ?? [dois]
  let consultas = 0
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.includes('/horarios')) {
      const horarios = listas[Math.min(consultas++, listas.length - 1)]
      return json({ medicoId: 1, exameId: 7, data: '2026-11-03', horarios })
    }
    if (url === '/api/agendamentos' && init?.method === 'POST') {
      return (opcoes.post ?? (() => json(criado(), 201)))()
    }
    return Promise.reject(new Error(`URL inesperada: ${url}`))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function consultasDeHorarios(fetchMock: ReturnType<typeof simularApi>) {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes('/horarios')).length
}

function renderizar() {
  const onFechar = vi.fn()
  const onAtualizado = vi.fn()
  // O nome fica com o pai (AgendarPagina); aqui um pai mínimo guarda o estado.
  function Pai() {
    const [nome, setNome] = useState('')
    return (
      <PainelDia
        exame={exame}
        medico={medico}
        data="2026-11-03"
        nome={nome}
        onNome={setNome}
        onFechar={onFechar}
        onAtualizado={onAtualizado}
      />
    )
  }
  render(<Pai />)
  return { onFechar, onAtualizado }
}

async function escolherHorarioEPreencher(nome = 'Maria Silva', horario = '08:00–08:40') {
  fireEvent.click(await screen.findByRole('button', { name: horario }))
  fireEvent.change(screen.getByLabelText('Nome do paciente'), { target: { value: nome } })
}

function agendar() {
  fireEvent.click(screen.getByRole('button', { name: 'Agendar' }))
}

describe('PainelDia', () => {
  it('mostra data, exame, médico e os horários livres do dia', async () => {
    const fetchMock = simularApi()
    renderizar()

    expect(
      screen.getByRole('dialog', { name: 'terça-feira, 3 de novembro de 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Ultrassonografia Abdominal Total (40 min)')).toBeInTheDocument()
    expect(screen.getByText('Dra. Helena Marques')).toBeInTheDocument()
    expect(screen.getByText('Carregando horários…')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '08:00–08:40' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '08:40–09:20' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/medicos/1/horarios?data=2026-11-03&exameId=7',
      undefined,
    )
  })

  it('valida horário e nome (3 a 100, sem espaços nas pontas) antes de enviar', async () => {
    const fetchMock = simularApi()
    renderizar()
    await screen.findByRole('button', { name: '08:00–08:40' })

    agendar()
    expect(screen.getByText('Escolha um horário.')).toBeInTheDocument()
    expect(screen.getByText('Informe o nome do paciente.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '08:00–08:40' }))
    fireEvent.change(screen.getByLabelText('Nome do paciente'), { target: { value: '  ab  ' } })
    expect(screen.getByText('O nome deve ter pelo menos 3 caracteres.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome do paciente')).toHaveAttribute('aria-invalid', 'true')

    fireEvent.change(screen.getByLabelText('Nome do paciente'), {
      target: { value: 'a'.repeat(101) },
    })
    expect(screen.getByText('O nome deve ter no máximo 100 caracteres.')).toBeInTheDocument()

    agendar()
    const posts = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')
    expect(posts).toHaveLength(0)
  })

  it('sucesso: envia o nome aparado, confirma no painel e avisa para atualizar o mês', async () => {
    const fetchMock = simularApi()
    const { onAtualizado } = renderizar()
    await escolherHorarioEPreencher('  Maria Silva  ')

    agendar()

    expect(await screen.findByText('Agendamento confirmado')).toBeInTheDocument()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('08:00–08:40')).toBeInTheDocument()
    expect(onAtualizado).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls.find(([, i]) => i?.method === 'POST') as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({
      pacienteNome: 'Maria Silva',
      exameId: 7,
      medicoId: 1,
      inicio: '2026-11-03T08:00',
    })
  })

  it('"Agendar outro horário" volta ao formulário vazio com horários atualizados', async () => {
    const fetchMock = simularApi({ horarios: [dois, apenasUm] })
    renderizar()
    await escolherHorarioEPreencher()
    agendar()
    await screen.findByText('Agendamento confirmado')

    fireEvent.click(screen.getByRole('button', { name: 'Agendar outro horário' }))

    expect(await screen.findByLabelText('Nome do paciente')).toHaveValue('')
    await waitFor(() => expect(consultasDeHorarios(fetchMock)).toBe(2))
    await waitFor(() => expect(screen.queryByRole('button', { name: '08:00–08:40' })).toBeNull())
  })

  it('desabilita o botão enquanto envia', async () => {
    let concluir: (r: Response) => void = () => {}
    simularApi({ post: () => new Promise<Response>((resolve) => (concluir = resolve)) })
    renderizar()
    await escolherHorarioEPreencher()

    agendar()

    expect(await screen.findByRole('button', { name: 'Agendando…' })).toBeDisabled()
    concluir(new Response(JSON.stringify(criado()), { status: 201 }))
    expect(await screen.findByText('Agendamento confirmado')).toBeInTheDocument()
  })

  it('409: avisa, recarrega os horários e limpa a seleção, avisando o mês', async () => {
    const fetchMock = simularApi({
      horarios: [dois, apenasUm],
      post: () => json({ statusCode: 409, error: 'Conflict', message: 'Horário já ocupado' }, 409),
    })
    const { onAtualizado } = renderizar()
    await escolherHorarioEPreencher()
    expect(consultasDeHorarios(fetchMock)).toBe(1)

    agendar()

    expect(await screen.findByRole('alert')).toHaveTextContent(/acabou de ser ocupado/)
    await waitFor(() => expect(consultasDeHorarios(fetchMock)).toBe(2))
    expect(await screen.findByRole('button', { name: '08:40–09:20' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.queryByRole('button', { name: '08:00–08:40' })).toBeNull()
    expect(screen.getByLabelText('Nome do paciente')).toHaveValue('Maria Silva')
    expect(onAtualizado).toHaveBeenCalledTimes(1)
  })

  it.each([
    [400, 'Bad Request', ['nome curto', 'inicio inválido'], 'nome curto; inicio inválido'],
    [404, 'Not Found', 'Médico não encontrado', 'Médico não encontrado'],
    [422, 'Unprocessable Entity', 'Horário no passado', 'Horário no passado'],
  ])('%i: mostra a mensagem da API e mantém a escolha', async (status, error, message, esperado) => {
    simularApi({ post: () => json({ statusCode: status, error, message }, status) })
    const { onAtualizado } = renderizar()
    await escolherHorarioEPreencher()

    agendar()

    expect(await screen.findByRole('alert')).toHaveTextContent(esperado)
    expect(screen.getByRole('button', { name: '08:00–08:40' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Nome do paciente')).toHaveValue('Maria Silva')
    expect(onAtualizado).not.toHaveBeenCalled()
  })

  it('falha de rede no POST mostra mensagem genérica', async () => {
    simularApi({ post: () => Promise.reject(new TypeError('Failed to fetch')) })
    renderizar()
    await escolherHorarioEPreencher()

    agendar()

    expect(await screen.findByRole('alert')).toHaveTextContent(/conectar ao servidor/)
  })

  it('dia sem horários livres mostra estado vazio e não oferece o formulário', async () => {
    simularApi({ horarios: [[]] })
    renderizar()

    expect(await screen.findByText(/Nenhum horário livre neste dia/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Nome do paciente')).toBeNull()
  })

  it('erro ao carregar horários mostra a mensagem e permite tentar de novo', async () => {
    let falhar = true
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        falhar
          ? json({ statusCode: 500, error: 'Internal Server Error', message: 'Falha interna' }, 500)
          : json({ medicoId: 1, exameId: 7, data: '2026-11-03', horarios: dois }),
      ),
    )
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha interna')
    falhar = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('button', { name: '08:00–08:40' })).toBeInTheDocument()
  })

  it('fecha com Esc e pelo botão de fechar, e recebe o foco ao abrir', async () => {
    simularApi()
    const { onFechar } = renderizar()
    await screen.findByRole('button', { name: '08:00–08:40' })

    expect(screen.getByRole('dialog')).toHaveFocus()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onFechar).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Fechar painel' }))
    expect(onFechar).toHaveBeenCalledTimes(2)
  })
})
