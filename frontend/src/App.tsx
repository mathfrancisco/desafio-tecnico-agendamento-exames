import { useState } from 'react'
import type { Agendamento, Exame, Horario, Medico } from './api/types'
import AgendamentoForm from './components/AgendamentoForm'
import Confirmacao from './components/Confirmacao'
import ExameBusca from './components/ExameBusca'
import HorariosLista from './components/HorariosLista'
import MedicoData from './components/MedicoData'

export default function App() {
  const [exame, setExame] = useState<Exame | null>(null)
  const [medico, setMedico] = useState<Medico | null>(null)
  const [data, setData] = useState('')
  const [horario, setHorario] = useState<Horario | null>(null)
  const [versaoHorarios, setVersaoHorarios] = useState(0)
  const [aviso, setAviso] = useState<string | null>(null)
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null)

  // Mudar uma etapa limpa as seguintes.
  function escolherExame(novo: Exame) {
    if (novo.id === exame?.id) return
    setExame(novo)
    setMedico(null)
    setData('')
    setHorario(null)
    setAviso(null)
  }

  function escolherMedico(novo: Medico) {
    if (novo.id === medico?.id) return
    setMedico(novo)
    setHorario(null)
    setAviso(null)
  }

  function escolherData(nova: string) {
    setData(nova)
    setHorario(null)
    setAviso(null)
  }

  function escolherHorario(novo: Horario) {
    setHorario(novo)
    setAviso(null)
  }

  function horarioOcupado(mensagem: string) {
    setAviso(mensagem)
    setHorario(null)
    setVersaoHorarios((v) => v + 1)
  }

  function novoAgendamento() {
    setExame(null)
    setMedico(null)
    setData('')
    setHorario(null)
    setAviso(null)
    setAgendamento(null)
  }

  return (
    <main className="pagina">
      <header>
        <h1>Agendamento de exames</h1>
        <p className="subtitulo">Escolha o exame, o médico, a data e o horário.</p>
      </header>

      {agendamento && exame && medico ? (
        <Confirmacao
          agendamento={agendamento}
          exame={exame}
          medico={medico}
          onNovo={novoAgendamento}
        />
      ) : (
        <>
          <ExameBusca selecionado={exame} onSelecionar={escolherExame} />
          <MedicoData
            habilitado={exame !== null}
            medico={medico}
            data={data}
            onMedico={escolherMedico}
            onData={escolherData}
          />
          {exame && medico && data ? (
            <HorariosLista
              exame={exame}
              medico={medico}
              data={data}
              versao={versaoHorarios}
              selecionado={horario}
              aviso={aviso}
              onSelecionar={escolherHorario}
            />
          ) : (
            <section className="etapa">
              <h2>3. Horário</h2>
              <p className="estado">Escolha exame, médico e data para ver os horários.</p>
            </section>
          )}
          {exame && medico && data && horario && (
            <AgendamentoForm
              exame={exame}
              medico={medico}
              data={data}
              horario={horario}
              onCriado={setAgendamento}
              onConflito={horarioOcupado}
            />
          )}
        </>
      )}
    </main>
  )
}
