import type { Exame } from '../../domain/exame';
import type { ExamesRepository } from '../ports/exames.repository';

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export class BuscarExames {
  constructor(private readonly exames: ExamesRepository) {}

  /** PR7: trecho do nome, sem diferenciar maiúsculas nem acentos; ordenado por nome. */
  executar(nome = ''): Exame[] {
    const termo = normalizar(nome.trim());
    return this.exames
      .listar()
      .filter((exame) => normalizar(exame.nome).includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }
}
