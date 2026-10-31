import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { config } from '../config';
import type { Exame } from '../domain/exame';

/** Lê o CSV `id,nome,duracao_minutos` (com cabeçalho). Falha na subida se uma linha for inválida. */
export function parseExamesCsv(texto: string): Exame[] {
  const linhas = texto
    .replace(/^\u{FEFF}/u, '')
    .split(/\r?\n/)
    .filter((linha) => linha.trim() !== '')
    .slice(1);

  return linhas.map((linha) => {
    const [id, nome, duracao] = linha.split(',');
    const exame = {
      id: Number(id),
      nome: nome?.trim(),
      duracaoMinutos: Number(duracao),
    };
    if (
      !Number.isInteger(exame.id) ||
      !exame.nome ||
      !(exame.duracaoMinutos > 0)
    ) {
      throw new Error(`Linha inválida em exames.csv: "${linha}"`);
    }
    return exame;
  });
}

@Injectable()
export class ExamesRepository {
  private readonly exames = parseExamesCsv(
    readFileSync(config().examesCsvPath, 'utf8'),
  );

  listar(): Exame[] {
    return this.exames;
  }

  buscarPorId(id: number): Exame | undefined {
    return this.exames.find((exame) => exame.id === id);
  }
}
