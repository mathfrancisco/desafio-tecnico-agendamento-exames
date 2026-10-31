import { useState } from 'react'
import type { Exame } from './api/types'
import ExameBusca from './components/ExameBusca'

export default function App() {
  const [exame, setExame] = useState<Exame | null>(null)

  return (
    <main className="pagina">
      <header>
        <h1>Agendamento de exames</h1>
        <p className="subtitulo">Escolha o exame, o médico, a data e o horário.</p>
      </header>
      <ExameBusca selecionado={exame} onSelecionar={setExame} />
    </main>
  )
}
