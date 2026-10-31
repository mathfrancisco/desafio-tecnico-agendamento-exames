import { useState } from 'react'
import type { Exame } from './api/types'
import Sidebar, { type Tela } from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'

const TITULOS: Record<Tela, string> = {
  agendar: 'Agendar exame',
  agendamentos: 'Agendamentos',
}

export default function App() {
  const [tela, setTela] = useState<Tela>('agendar')
  const [exame, setExame] = useState<Exame | null>(null)

  function escolherExame(novo: Exame) {
    setExame(novo)
    setTela('agendar')
  }

  return (
    <div className="app">
      <Topbar onSelecionarExame={escolherExame} />
      <Sidebar tela={tela} onTela={setTela} />
      <main className="conteudo">
        <h1>{TITULOS[tela]}</h1>
        {exame && <p>{exame.nome}</p>}
      </main>
    </div>
  )
}
