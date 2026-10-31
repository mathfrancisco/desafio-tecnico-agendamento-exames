import { useCallback, useEffect, useRef, useState } from 'react'
import { mensagemDeErro } from '../api/client'

export type Requisicao<T> =
  | { status: 'ocioso' }
  | { status: 'carregando' }
  | { status: 'erro'; mensagem: string }
  | { status: 'ok'; dados: T }

/**
 * Executa `buscar` quando `chave` muda e devolve [estado, recarregar].
 * `chave` deve identificar tudo de que `buscar` depende; respostas de chaves
 * antigas são descartadas. `chave === null` não busca nada (estado 'ocioso').
 * `recarregar` refaz a busca mantendo os dados antigos na tela até a nova
 * resposta chegar (exceto após erro, que volta a 'carregando').
 */
export function useRequisicao<T>(
  buscar: () => Promise<T>,
  chave: string | null,
): [Requisicao<T>, () => void] {
  const [resultado, setResultado] = useState<{
    chave: string
    estado: Requisicao<T>
  } | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const buscarRef = useRef(buscar)

  useEffect(() => {
    buscarRef.current = buscar
  })

  useEffect(() => {
    if (chave === null) return
    let cancelado = false
    buscarRef.current().then(
      (dados) => {
        if (!cancelado) setResultado({ chave, estado: { status: 'ok', dados } })
      },
      (erro: unknown) => {
        if (!cancelado) {
          setResultado({ chave, estado: { status: 'erro', mensagem: mensagemDeErro(erro) } })
        }
      },
    )
    return () => {
      cancelado = true
    }
  }, [chave, tentativa])

  const recarregar = useCallback(() => {
    setResultado((atual) => (atual?.estado.status === 'erro' ? null : atual))
    setTentativa((n) => n + 1)
  }, [])

  let estado: Requisicao<T>
  if (chave === null) estado = { status: 'ocioso' }
  else if (resultado?.chave === chave) estado = resultado.estado
  else estado = { status: 'carregando' }
  return [estado, recarregar]
}
