import { useEffect, useRef, useState } from 'react'
import { mensagemDeErro } from './api/client'

export type Requisicao<T> =
  | { status: 'carregando' }
  | { status: 'erro'; mensagem: string }
  | { status: 'ok'; dados: T }

/**
 * Executa `buscar` quando `chave` muda e devolve carregando/erro/ok.
 * `chave` deve identificar tudo de que `buscar` depende; respostas de chaves
 * antigas são descartadas.
 */
export function useRequisicao<T>(
  buscar: () => Promise<T>,
  chave: string,
): Requisicao<T> {
  const [resultado, setResultado] = useState<{
    chave: string
    estado: Requisicao<T>
  } | null>(null)
  const buscarRef = useRef(buscar)

  useEffect(() => {
    buscarRef.current = buscar
  })

  useEffect(() => {
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
  }, [chave])

  return resultado?.chave === chave ? resultado.estado : { status: 'carregando' }
}
