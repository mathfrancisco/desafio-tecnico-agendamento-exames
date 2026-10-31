import { useState } from 'react'
import type { Exame } from './api/types'
import AgendamentosPagina from './components/agendamentos/AgendamentosPagina'
import AgendarPagina from './components/agendar/AgendarPagina'
import ErroRetry from './components/layout/ErroRetry'
import Sidebar, { type Tela } from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import { useCatalogo } from './hooks/useCatalogo'

export default function App() {
  const [tela, setTela] = useState<Tela>('agendar')
  const [exame, setExame] = useState<Exame | null>(null)
  const [catalogo, recarregarCatalogo] = useCatalogo()

  function escolherExame(novo: Exame) {
    setExame(novo)
    setTela('agendar')
  }

  return (
    <div className="app">
      <Topbar onSelecionarExame={escolherExame} />
      <Sidebar tela={tela} onTela={setTela} />
      <main className="conteudo">
        {catalogo.status === 'erro' && (
          <ErroRetry mensagem={catalogo.mensagem} onTentar={recarregarCatalogo} />
        )}
        {catalogo.status === 'carregando' && (
          <p className="carregando" role="status">
            Carregando médicos e exames…
          </p>
        )}
        {catalogo.status === 'ok' && tela === 'agendar' && (
          <AgendarPagina exame={exame} medicos={catalogo.dados.medicos} exames={catalogo.dados.exames} />
        )}
        {catalogo.status === 'ok' && tela === 'agendamentos' && (
          <AgendamentosPagina medicos={catalogo.dados.medicos} exames={catalogo.dados.exames} />
        )}
      </main>
    </div>
  )
}
