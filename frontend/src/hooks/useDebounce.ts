import { useEffect, useState } from 'react'

/** Devolve `valor` somente depois de `atrasoMs` sem mudanças. */
export function useDebounce<T>(valor: T, atrasoMs: number): T {
  const [atrasado, setAtrasado] = useState(valor)

  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), atrasoMs)
    return () => clearTimeout(id)
  }, [valor, atrasoMs])

  return atrasado
}
