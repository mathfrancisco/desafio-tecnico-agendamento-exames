import type { Exame } from '../../domain/exame';

export const EXAMES_REPOSITORY = Symbol('EXAMES_REPOSITORY');

export interface ExamesRepository {
  listar(): Exame[];
  buscarPorId(id: number): Exame | undefined;
}
