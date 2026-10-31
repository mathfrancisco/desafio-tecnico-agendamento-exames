import { describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  buscarExames,
  buscarHorarios,
  criarAgendamento,
  mensagemDeErro,
} from './client'

function respostaJson(corpo: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(corpo), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

describe('client', () => {
  it('devolve o JSON em caso de sucesso e monta a URL com o termo', async () => {
    const fetchMock = vi.fn(() => respostaJson([{ id: 1, nome: 'Raio-X', duracaoMinutos: 20 }]))
    vi.stubGlobal('fetch', fetchMock)

    const exames = await buscarExames('  ressonância ')

    expect(exames).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/exames?nome=${encodeURIComponent('ressonância')}`,
      undefined,
    )
  })

  it('não envia o parâmetro nome quando a busca está vazia', async () => {
    const fetchMock = vi.fn(() => respostaJson([]))
    vi.stubGlobal('fetch', fetchMock)

    await buscarExames('   ')

    expect(fetchMock).toHaveBeenCalledWith('/api/exames', undefined)
  })

  it('monta a URL de horários com data e exame', async () => {
    const fetchMock = vi.fn(() => respostaJson({ horarios: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await buscarHorarios(2, 7, '2026-11-03')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/medicos/2/horarios?data=2026-11-03&exameId=7',
      undefined,
    )
  })

  it('envia o agendamento como JSON via POST', async () => {
    const fetchMock = vi.fn(() => respostaJson({ id: 1 }, 201))
    vi.stubGlobal('fetch', fetchMock)
    const dados = { pacienteNome: 'Maria', exameId: 7, medicoId: 1, inicio: '2026-11-03T08:00' }

    await criarAgendamento(dados)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/agendamentos')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(dados)
  })

  it('converte erro com message string em ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        respostaJson({ statusCode: 409, error: 'Conflict', message: 'Horário ocupado' }, 409),
      ),
    )

    await expect(criarAgendamento({} as never)).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'Horário ocupado',
    })
  })

  it('junta message em array (400 de validação)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        respostaJson(
          { statusCode: 400, error: 'Bad Request', message: ['nome curto', 'inicio inválido'] },
          400,
        ),
      ),
    )

    await expect(criarAgendamento({} as never)).rejects.toMatchObject({
      status: 400,
      message: 'nome curto; inicio inválido',
    })
  })

  it('usa mensagem genérica quando o corpo do erro não é JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('boom', { status: 500 }))))

    await expect(buscarExames()).rejects.toMatchObject({
      status: 500,
      message: 'Erro inesperado do servidor (500).',
    })
  })

  it('converte falha de rede em ApiError com status 0', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))

    const erro = await buscarExames().catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({ status: 0 })
    expect(mensagemDeErro(erro)).toMatch(/conectar ao servidor/)
  })

  it('mensagemDeErro usa texto genérico para erros desconhecidos', () => {
    expect(mensagemDeErro(new Error('x'))).toBe('Ocorreu um erro inesperado. Tente novamente.')
  })
})
