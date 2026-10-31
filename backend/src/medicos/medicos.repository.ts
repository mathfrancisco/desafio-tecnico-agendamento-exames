import { Injectable } from '@nestjs/common';
import { Medico, MEDICOS } from './medicos.data';

@Injectable()
export class MedicosRepository {
  listar(): Medico[] {
    return MEDICOS;
  }

  buscarPorId(id: number): Medico | undefined {
    return MEDICOS.find((medico) => medico.id === id);
  }
}
