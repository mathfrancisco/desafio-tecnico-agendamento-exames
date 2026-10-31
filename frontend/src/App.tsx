import { useState } from 'react'
import type { Exame, Horario, Medico } from './api/types'
import ExameBusca from './components/ExameBusca'
import HorariosLista from './components/HorariosLista'
import MedicoData from './components/MedicoData'

export default function App() {
  const [exame, setExame] = useState<Exame | null>(null)
  const [medico, setMedico] = useState<Medico | null>(null)
  const [data, setData] = useState('')
  const [horario, setHorario] = useState<Horario | null>(null)
  const [versaoHorarios] = useState(0)

  // Mudar uma etapa limpa as seguintes.
  function escolherExame(novo: Exame) {
    if (novo.id === exame?.id) return
    setExame(novo)
    setMedico(null)
    setData('')
    setHorario(null)
  }

  function escolherMedico(novo: Medico) {
    if (novo.id === medico?.id) return
    setMedico(novo)
    setHorario(null)
  }

  function escolherData(nova: string) {
    setData(nova)
    setHorario(null)
  }

  return (
    <main className="pagina">
      <header>
        <h1>Agendamento de exames</h1>
        <p className="subtitulo">Escolha o exame, o médico, a data e o horário.</p>
      </header>
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
          onSelecionar={setHorario}
        />
      ) : (
        <section className="etapa">
          <h2>3. Horário</h2>
          <p className="estado">Escolha exame, médico e data para ver os horários.</p>
        </section>
      )}
    </main>
  )
}
