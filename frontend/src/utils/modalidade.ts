export interface Modalidade {
  rotulo: string
  /** Cor forte: borda do cartão e selo. */
  cor: string
  /** Tom claro de fundo do cartão. */
  fundo: string
}

interface Regra extends Modalidade {
  termos: string[]
}

// A ordem importa: "Ecocardiograma com Doppler" deve cair em Ecocardiograma.
const REGRAS: Regra[] = [
  { termos: ['raio-x', 'raio x'], rotulo: 'Raio-X', cor: '#0284c7', fundo: '#e6f4fb' },
  { termos: ['mamografia'], rotulo: 'Mamografia', cor: '#db2777', fundo: '#fdeaf3' },
  { termos: ['ultrassonografia'], rotulo: 'Ultrassonografia', cor: '#0d9488', fundo: '#e2f6f3' },
  { termos: ['ecocardiograma'], rotulo: 'Ecocardiograma', cor: '#dc2626', fundo: '#fdeaea' },
  { termos: ['doppler'], rotulo: 'Doppler', cor: '#7c3aed', fundo: '#f0eafe' },
  { termos: ['tomografia'], rotulo: 'Tomografia', cor: '#d97706', fundo: '#fef3dc' },
  { termos: ['ressonancia'], rotulo: 'Ressonância', cor: '#4f46e5', fundo: '#ecedfe' },
  { termos: ['densitometria'], rotulo: 'Densitometria', cor: '#65a30d', fundo: '#eff8dc' },
  { termos: ['cintilografia'], rotulo: 'Cintilografia', cor: '#ea580c', fundo: '#fee9db' },
]

const OUTROS: Modalidade = { rotulo: 'Exame', cor: '#64748b', fundo: '#eef1f5' }

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Modalidade (e suas cores) deduzida por palavra-chave do nome do exame. */
export function modalidadeDoExame(nomeDoExame: string): Modalidade {
  const nome = normalizar(nomeDoExame)
  const regra = REGRAS.find((r) => r.termos.some((termo) => nome.includes(termo)))
  return regra ?? OUTROS
}
