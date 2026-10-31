import type { Medico } from '../../domain/medico';
import type { MedicosRepository } from '../ports/medicos.repository';

export class ListarMedicos {
  constructor(private readonly medicos: MedicosRepository) {}

  executar(): Medico[] {
    return this.medicos.listar();
  }
}
