import type { CSSProperties } from 'react'

/** Junta nomes de classe ignorando valores falsos. */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Estilo inline com custom properties CSS (`--nome`). */
export function variaveis(valores: Record<`--${string}`, string>): CSSProperties {
  return valores as CSSProperties
}
