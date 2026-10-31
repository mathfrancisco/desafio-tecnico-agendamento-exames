import { useEffect, useState } from 'react'
import { hojeNaClinica } from '../utils/datas'

const VERIFICAR_A_CADA_MS = 60_000

/** Data de hoje na clínica; muda sozinha quando passa da meia-noite com a tela aberta. */
export function useHoje(): string {
  const [hoje, setHoje] = useState(hojeNaClinica)

  useEffect(() => {
    const id = setInterval(() => setHoje(hojeNaClinica()), VERIFICAR_A_CADA_MS)
    return () => clearInterval(id)
  }, [])

  return hoje
}
