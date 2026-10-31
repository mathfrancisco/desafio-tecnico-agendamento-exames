import { readFileSync } from 'node:fs';
import type { ExamesRepository } from '../../application/ports/exames.repository';
import type { Exame } from '../../domain/exame';

/** Lê o CSV `id,nome,duracao_minutos` (com cabeçalho). Falha na subida se uma linha for inválida. */
export function parseExamesCsv(texto: string): Exame[] {
  const linhas = texto
    .replace(/^\u{FEFF}/u, '')
    .split(/\r?\n/)
    .filter((linha) => linha.trim() !== '')
    .slice(1);

  return linhas.map((linha) => {
    const colunas = linha.split(',');
    const [id, nome, duracao] = colunas;
    const exame = {
      id: Number(id),
      nome: nome?.trim(),
      duracaoMinutos: Number(duracao),
    };
    // Duração inteira: a grade de horários conta em minutos (RN2).
    if (
      colunas.length !== 3 ||
      !Number.isInteger(exame.id) ||
      !exame.nome ||
      !Number.isInteger(exame.duracaoMinutos) ||
      exame.duracaoMinutos <= 0
    ) {
      throw new Error(`Linha inválida em exames.csv: "${linha}"`);
    }
    return exame;
  });
}

export class ExamesCsvRepository implements ExamesRepository {
  private readonly exames: Exame[];

  constructor(caminho: string) {
    this.exames = parseExamesCsv(readFileSync(caminho, 'utf8'));
  }

  listar(): Exame[] {
    return this.exames;
  }

  buscarPorId(id: number): Exame | undefined {
    return this.exames.find((exame) => exame.id === id);
  }
}
