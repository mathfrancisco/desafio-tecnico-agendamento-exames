import type { ReactNode } from 'react'

interface IconeProps {
  tamanho?: number
}

function Icone({ tamanho = 20, children }: IconeProps & { children: ReactNode }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function IconeBusca(props: IconeProps) {
  return (
    <Icone {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icone>
  )
}

export function IconeCalendario(props: IconeProps) {
  return (
    <Icone {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Icone>
  )
}

export function IconeLista(props: IconeProps) {
  return (
    <Icone {...props}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </Icone>
  )
}

export function IconeRelogio(props: IconeProps) {
  return (
    <Icone {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icone>
  )
}

export function IconeUsuario(props: IconeProps) {
  return (
    <Icone {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icone>
  )
}

export function IconeExame(props: IconeProps) {
  return (
    <Icone {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </Icone>
  )
}

export function IconeMedico(props: IconeProps) {
  return (
    <Icone {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </Icone>
  )
}

export function IconeLocal(props: IconeProps) {
  return (
    <Icone {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </Icone>
  )
}

export function IconeFechar(props: IconeProps) {
  return (
    <Icone {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Icone>
  )
}

export function IconeSetaEsquerda(props: IconeProps) {
  return (
    <Icone {...props}>
      <polyline points="15 18 9 12 15 6" />
    </Icone>
  )
}

export function IconeSetaDireita(props: IconeProps) {
  return (
    <Icone {...props}>
      <polyline points="9 18 15 12 9 6" />
    </Icone>
  )
}

export function IconeMais(props: IconeProps) {
  return (
    <Icone {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Icone>
  )
}

/** Marca do app: quadrado azul com um anel de scanner. */
export function Logo({ tamanho = 32 }: IconeProps) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="#3b82f6" />
      <circle cx="16" cy="16" r="8" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="16" cy="16" r="2.5" fill="#fff" />
    </svg>
  )
}
