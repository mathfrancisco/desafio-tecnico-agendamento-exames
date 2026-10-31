import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Medico } from '../api/types'
import { hojeLocal } from '../datas'
import MedicoData from './MedicoData'

const medicos: Medico[] = [
  {
    id: 1,
    nome: 'Dra. Helena Marques',
    crm: 'CRM-MG 11111',
    turnos: [
      { dia: 'QUA', inicio: '08:00', fim: '12:00' },
      { dia: 'SEG', inicio: '08:00', fim: '12:00' },
      { dia: 'SEG', inicio: '14:00', fim: '18:00' },
    ],
  },
  { id: 2, nome: 'Dr. Rafael Teixeira', crm: 'CRM-MG 22222', turnos: [{ dia: 'SAB', inicio: '08:00', fim: '12:00' }] },
]

function prepararFetch() {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(medicos)))))
}

describe('MedicoData', () => {
  it('lista médicos com os dias de atendimento derivados dos turnos', async () => {
    prepararFetch()
    render(<MedicoData habilitado medico={null} data="" onMedico={vi.fn()} onData={vi.fn()} />)

    expect(await screen.findByText('Atende: Seg, Qua')).toBeInTheDocument()
    expect(screen.getByText('Atende: Sab')).toBeInTheDocument()
  })

  it('seleciona médico e informa a data, com mínimo igual a hoje', async () => {
    prepararFetch()
    const onMedico = vi.fn()
    const onData = vi.fn()
    render(<MedicoData habilitado medico={null} data="" onMedico={onMedico} onData={onData} />)

    fireEvent.click(await screen.findByRole('radio', { name: /Rafael/ }))
    expect(onMedico).toHaveBeenCalledWith(medicos[1])

    const campo = screen.getByLabelText('Data')
    expect(campo).toHaveAttribute('min', hojeLocal())
    fireEvent.change(campo, { target: { value: '2030-01-15' } })
    expect(onData).toHaveBeenCalledWith('2030-01-15')
  })

  it('fica desabilitado até escolher o exame', async () => {
    prepararFetch()
    render(<MedicoData habilitado={false} medico={null} data="" onMedico={vi.fn()} onData={vi.fn()} />)

    expect(screen.getByText('Escolha um exame para continuar.')).toBeInTheDocument()
    expect(await screen.findByRole('radio', { name: /Helena/ })).toBeDisabled()
    expect(screen.getByLabelText('Data')).toBeDisabled()
  })

  it('mostra erro ao falhar o carregamento dos médicos', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('x'))))
    render(<MedicoData habilitado medico={null} data="" onMedico={vi.fn()} onData={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/conectar ao servidor/)
  })
})
