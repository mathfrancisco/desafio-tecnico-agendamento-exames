/**
 * Datas de agenda são texto (`YYYY-MM-DD`, `YYYY-MM`, `YYYY-MM-DDTHH:mm`) no
 * horário da clínica. Toda conta de calendário usa `Date.UTC`, para não
 * depender do fuso nem do horário de verão do navegador. Só `hojeNaClinica`
 * olha para o relógio.
 */

/** Dias da semana, segunda primeiro (mesma ordem da grade do calendário). */
export const DIAS_SEMANA_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const DIAS_SEMANA_LONGOS = [
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
  'domingo',
]

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0')
}

// PR1: a agenda é toda no fuso da clínica, mesmo que o navegador esteja em outro.
const AGORA_NA_CLINICA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Data e hora atuais no fuso da clínica (America/Sao_Paulo), como `YYYY-MM-DDTHH:mm`. */
export function agoraNaClinica(): string {
  const p: Record<string, string> = {}
  for (const parte of AGORA_NA_CLINICA.formatToParts(new Date())) p[parte.type] = parte.value
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/** Data de hoje no fuso da clínica, como `YYYY-MM-DD`. */
export function hojeNaClinica(): string {
  return dataDe(agoraNaClinica())
}

/** `2026-11-03` (ou `2026-11-03T08:00`) -> `2026-11`. */
export function mesDe(data: string): string {
  return data.slice(0, 7)
}

function partesDoMes(mes: string): [number, number] {
  const [ano, numero] = mes.split('-').map(Number)
  return [ano, numero]
}

/** Soma `delta` meses (pode ser negativo) a um `YYYY-MM`. */
export function deslocarMes(mes: string, delta: number): string {
  const [ano, numero] = partesDoMes(mes)
  const indice = ano * 12 + (numero - 1) + delta
  return `${Math.floor(indice / 12)}-${doisDigitos((indice % 12) + 1)}`
}

/** `2026-11` -> `Novembro de 2026`. */
export function nomeDoMes(mes: string): string {
  const [ano, numero] = partesDoMes(mes)
  const nome = MESES[numero - 1]
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`
}

/** Todos os dias do mês, em ordem: `['2026-11-01', ..., '2026-11-30']`. */
export function diasDoMes(mes: string): string[] {
  const [ano, numero] = partesDoMes(mes)
  const total = new Date(Date.UTC(ano, numero, 0)).getUTCDate()
  return Array.from({ length: total }, (_, i) => `${mes}-${doisDigitos(i + 1)}`)
}

/** Posição do dia na semana com segunda = 0 ... domingo = 6. */
export function indiceSemana(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number)
  return (new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay() + 6) % 7
}

/**
 * Semanas do mês, segunda a domingo. Posições fora do mês são `null`, e a
 * última semana é completada até domingo: todas as linhas têm 7 posições.
 */
export function gradeDoMes(mes: string): (string | null)[][] {
  const dias: (string | null)[] = [
    ...Array<null>(indiceSemana(`${mes}-01`)).fill(null),
    ...diasDoMes(mes),
  ]
  while (dias.length % 7 !== 0) dias.push(null)
  return Array.from({ length: dias.length / 7 }, (_, i) => dias.slice(i * 7, i * 7 + 7))
}

/** `2026-11-03` (ou `2026-11-03T08:00`) -> `03/11/2026`. */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

/** `2026-11-03` -> `3 de novembro`. */
export function formatarDiaMes(data: string): string {
  const [, mes, dia] = data.split('-').map(Number)
  return `${dia} de ${MESES[mes - 1]}`
}

/** `2026-11-03` -> `terça-feira, 3 de novembro de 2026`. */
export function formatarDataLonga(data: string): string {
  return `${DIAS_SEMANA_LONGOS[indiceSemana(data)]}, ${formatarDiaMes(data)} de ${data.slice(0, 4)}`
}

/** `2026-11-03T08:40` -> `08:40`. */
export function horaDe(inicio: string): string {
  return inicio.slice(11, 16)
}

/** `2026-11-03T08:40` -> `2026-11-03`. */
export function dataDe(inicio: string): string {
  return inicio.slice(0, 10)
}
