import { useId } from 'react'
import { listarMedicos } from '../api/client'
import type { DiaSemana, Medico } from '../api/types'
import { hojeLocal } from '../datas'
import { useRequisicao } from '../useRequisicao'

const ORDEM_DIAS: DiaSemana[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']

function diasDeAtendimento(medico: Medico): string {
  const dias = new Set(medico.turnos.map((turno) => turno.dia))
  return ORDEM_DIAS.filter((dia) => dias.has(dia))
    .map((dia) => dia.charAt(0) + dia.slice(1).toLowerCase())
    .join(', ')
}

interface Props {
  habilitado: boolean
  medico: Medico | null
  data: string
  onMedico: (medico: Medico) => void
  onData: (data: string) => void
}

export default function MedicoData({ habilitado, medico, data, onMedico, onData }: Props) {
  const id = useId()
  const medicos = useRequisicao(listarMedicos, 'medicos')

  return (
    <section className="etapa" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>2. Médico e data</h2>
      {!habilitado && <p className="estado">Escolha um exame para continuar.</p>}

      <fieldset disabled={!habilitado}>
        <legend>Médico</legend>
        {medicos.status === 'carregando' && <p className="estado">Carregando médicos…</p>}
        {medicos.status === 'erro' && (
          <p className="estado erro" role="alert">
            {medicos.mensagem}
          </p>
        )}
        {medicos.status === 'ok' && (
          <ul className="lista-opcoes">
            {medicos.dados.map((m) => (
              <li key={m.id}>
                <label className="opcao-radio">
                  <input
                    type="radio"
                    name={`${id}-medico`}
                    checked={medico?.id === m.id}
                    onChange={() => onMedico(m)}
                  />
                  <span>
                    <strong>{m.nome}</strong> <span className="detalhe">{m.crm}</span>
                    <br />
                    <span className="detalhe">Atende: {diasDeAtendimento(m)}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="campo">
          <label htmlFor={`${id}-data`}>Data</label>
          <input
            id={`${id}-data`}
            type="date"
            min={hojeLocal()}
            value={data}
            onChange={(e) => onData(e.target.value)}
          />
        </div>
      </fieldset>
    </section>
  )
}
