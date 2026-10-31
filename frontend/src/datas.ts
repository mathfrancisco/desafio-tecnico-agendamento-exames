/** Data de hoje no fuso local do navegador, como `YYYY-MM-DD`. */
export function hojeLocal(): string {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

/** `2026-11-03` (ou `2026-11-03T08:00`) -> `03/11/2026`. */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}
