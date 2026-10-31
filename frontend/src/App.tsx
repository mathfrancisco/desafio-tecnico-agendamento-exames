import { useState } from 'react'
import type { Exame, Medico } from './api/types'
import ExameBusca from './components/ExameBusca'
import MedicoData from './components/MedicoData'

export default function App() {
  const [exame, setExame] = useState<Exame | null>(null)
  const [medico, setMedico] = useState<Medico | null>(null)
  const [data, setData] = useState('')

  function escolherExame(novo: Exame) {
    if (novo.id === exame?.id) return
    setExame(novo)
    setMedico(null)
    setData('')
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
        onMedico={setMedico}
        onData={setData}
      />
    </main>
  )
}
