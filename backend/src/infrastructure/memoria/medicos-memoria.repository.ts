import type { MedicosRepository } from '../../application/ports/medicos.repository';
import type { Medico } from '../../domain/medico';
import { MEDICOS } from './medicos.data';

export class MedicosMemoriaRepository implements MedicosRepository {
  listar(): Medico[] {
    return MEDICOS;
  }

  buscarPorId(id: number): Medico | undefined {
    return MEDICOS.find((medico) => medico.id === id);
  }
}
