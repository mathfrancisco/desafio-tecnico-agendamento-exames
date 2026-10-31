import type { Medico } from '../../domain/medico';

export const MEDICOS_REPOSITORY = Symbol('MEDICOS_REPOSITORY');

export interface MedicosRepository {
  listar(): Medico[];
  buscarPorId(id: number): Medico | undefined;
}
