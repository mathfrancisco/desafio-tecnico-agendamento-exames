import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Agendamento } from '../../api/types'
import Calendario from './Calendario'
import DiaCelula from './DiaCelula'
import EventoCard from './EventoCard'
import EventosDoDia from './EventosDoDia'
import NavegacaoMes from './NavegacaoMes'

const agendamento: Agendamento = {
  id: 1,
  pacienteNome: 'Maria Silva',
  exameId: 20,
  medicoId: 1,
  inicio: '2026-11-03T08:00',
  fim: '2026-11-03T08:40',
  criadoEm: '2026-10-31T15:00:00.000Z',
}

describe('Calendario', () => {
  it('desenha todos os dias do mês e destaca hoje', () => {
    render(
      <Calendario
        mes="2026-11"
        renderDia={(data) => <DiaCelula data={data} hoje={data === '2026-11-05'} />}
      />,
    )

    const grade = screen.getByRole('region', { name: 'Calendário de Novembro de 2026' })
    // nov/2026 começa no domingo: 6 espaços antes e 6 depois (6 semanas)
    expect(grade.querySelectorAll('.dia--vazio')).toHaveLength(12)
    expect(screen.getByText('domingo, 1 de novembro de 2026')).toBeInTheDocument()
    expect(screen.getByText('segunda-feira, 30 de novembro de 2026')).toBeInTheDocument()
    expect(screen.getByText('quinta-feira, 5 de novembro de 2026').closest('li')).toHaveAttribute(
      'aria-current',
      'date',
    )
  })
})

describe('DiaCelula', () => {
  it('sem ação não tem botão; com ação o botão chama onClick', () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <ol>
        <DiaCelula data="2026-11-03" />
      </ol>,
    )
    expect(screen.queryByRole('button')).toBeNull()

    rerender(
      <ol>
        <DiaCelula data="2026-11-03" acao={{ rotulo: '3 de novembro, 2 horários livres', onClick }} />
      </ol>,
    )
    fireEvent.click(screen.getByRole('button', { name: '3 de novembro, 2 horários livres' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('EventoCard', () => {
  it('mostra exame, paciente e horário com a cor da modalidade', () => {
    render(<EventoCard agendamento={agendamento} exameNome="Ressonância Magnética de Crânio" />)

    expect(screen.getByText('Ressonância Magnética de Crânio')).toBeInTheDocument()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Ressonância Magnética de Crânio').closest('.evento')).toHaveStyle({
      '--mod-cor': '#4f46e5',
    })
  })

  it('vira botão quando recebe onSelecionar', () => {
    const onSelecionar = vi.fn()
    render(
      <EventoCard agendamento={agendamento} exameNome="Raio-X de Tórax" onSelecionar={onSelecionar} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Raio-X de Tórax, Maria Silva, 08:00' }))

    expect(onSelecionar).toHaveBeenCalledWith(agendamento)
  })
})

describe('EventosDoDia', () => {
  const varios = [1, 2, 3, 4].map((id) => ({ ...agendamento, id, pacienteNome: `Paciente ${id}` }))

  it('limita os cartões e expande em "+N mais"', () => {
    render(<EventosDoDia agendamentos={varios} nomeDoExame={() => 'Raio-X'} limite={2} onSelecionar={vi.fn()} />)

    expect(screen.getAllByRole('button', { name: /Raio-X, Paciente/ })).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: '+2 mais' }))
    expect(screen.getAllByRole('button', { name: /Raio-X, Paciente/ })).toHaveLength(4)
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar menos' }))
    expect(screen.getAllByRole('button', { name: /Raio-X, Paciente/ })).toHaveLength(2)
  })

  it('sem onSelecionar o "+N mais" é só texto', () => {
    render(<EventosDoDia agendamentos={varios} nomeDoExame={() => 'Raio-X'} limite={2} />)

    expect(screen.getByText('+2 mais')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('NavegacaoMes', () => {
  afterEach(() => vi.useRealTimers())

  it('navega para o mês anterior, o próximo e volta para hoje', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 31, 10))
    const onMes = vi.fn()
    render(<NavegacaoMes mes="2026-12" onMes={onMes} />)

    expect(screen.getByText('Dezembro de 2026')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(onMes).toHaveBeenLastCalledWith('2026-11')
    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(onMes).toHaveBeenLastCalledWith('2027-01')
    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    expect(onMes).toHaveBeenLastCalledWith('2026-10')
  })

  it('desabilita "anterior" no mês mínimo', () => {
    render(<NavegacaoMes mes="2026-11" mesMinimo="2026-11" onMes={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeEnabled()
  })
})
