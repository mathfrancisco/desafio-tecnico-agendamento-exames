import { useState } from 'react'
import type { Exame, Medico } from '../../api/types'
import { useHoje } from '../../hooks/useHoje'
import { variaveis } from '../../utils/classes'
import { mesDe } from '../../utils/datas'
import { modalidadeDoExame } from '../../utils/modalidade'
import Calendario from '../calendario/Calendario'
import DiaCelula from '../calendario/DiaCelula'
import NavegacaoMes from '../calendario/NavegacaoMes'
import SeletorMedico from '../calendario/SeletorMedico'
import AgendaDoMedico from './AgendaDoMedico'

interface Props {
  /** Exame escolhido na busca da topbar. */
  exame: Exame | null
  medicos: Medico[]
  exames: Exame[]
}

export default function AgendarPagina({ exame, medicos, exames }: Props) {
  const hoje = useHoje()
  const [mes, setMes] = useState(() => mesDe(hoje))
  const [medicoId, setMedicoId] = useState<number | null>(null)
  const [nomePaciente, setNomePaciente] = useState('')
  const medico = medicos.find((m) => m.id === medicoId) ?? null
  const mesAtual = mesDe(hoje)
  // Se o mês virar com a tela aberta, o mês escolhido pode ter ficado no passado.
  const mesVisivel = mes < mesAtual ? mesAtual : mes

  return (
    <>
      <section className="cabecalho" aria-labelledby="titulo-agendar">
        <h1 id="titulo-agendar" className="cabecalho__titulo">
          <span className="marcador" aria-hidden="true" />
          Agendar exame
        </h1>

        {exame ? (
          <p className="exame-atual">
            <span
              className="marcador marcador--pequeno"
              style={variaveis({ '--marcador': modalidadeDoExame(exame.nome).cor })}
              aria-hidden="true"
            />
            <strong>{exame.nome}</strong>
            <span className="pilula pilula--neutra">{exame.duracaoMinutos} min</span>
          </p>
        ) : (
          <p className="estado">
            Nenhum exame selecionado. Busque o exame pelo nome na barra superior para começar.
          </p>
        )}

        <div className="cabecalho__linha">
          <SeletorMedico
            medicos={medicos}
            selecionadoId={medicoId}
            onSelecionar={setMedicoId}
            rotulo="Médico"
            mostrarDias
          />
          <NavegacaoMes mes={mesVisivel} onMes={setMes} mesMinimo={mesAtual} />
        </div>
      </section>

      {exame && medico ? (
        <AgendaDoMedico
          key={`${exame.id}|${medico.id}`}
          exame={exame}
          medico={medico}
          exames={exames}
          mes={mesVisivel}
          hoje={hoje}
          nomePaciente={nomePaciente}
          onNomePaciente={setNomePaciente}
        />
      ) : (
        <>
          <p className="estado estado--faixa" role="status">
            {exame
              ? 'Escolha um médico para ver os horários livres de cada dia.'
              : 'Escolha um exame e um médico para ver os horários livres de cada dia.'}
          </p>
          <Calendario
            mes={mesVisivel}
            renderDia={(data) => <DiaCelula data={data} hoje={data === hoje} apagado />}
          />
        </>
      )}
    </>
  )
}
