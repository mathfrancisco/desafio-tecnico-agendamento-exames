import { Injectable } from '@nestjs/common';
import { Exame } from '../domain/exame';
import { NaoEncontradoError } from '../domain/erros';
import { ExamesRepository } from './exames.repository';

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

@Injectable()
export class ExamesService {
  constructor(private readonly repository: ExamesRepository) {}

  buscar(nome = ''): Exame[] {
    const termo = normalizar(nome.trim());
    return this.repository
      .listar()
      .filter((exame) => normalizar(exame.nome).includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  obter(id: number): Exame {
    const exame = this.repository.buscarPorId(id);
    if (!exame) throw new NaoEncontradoError(`Exame ${id} não encontrado`);
    return exame;
  }
}
