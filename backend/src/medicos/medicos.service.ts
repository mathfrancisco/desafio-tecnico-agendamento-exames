import { Injectable } from '@nestjs/common';
import { NaoEncontradoError } from '../domain/erros';
import { Medico } from '../domain/medico';
import { MedicosRepository } from './medicos.repository';

@Injectable()
export class MedicosService {
  constructor(private readonly repository: MedicosRepository) {}

  listar(): Medico[] {
    return this.repository.listar();
  }

  obter(id: number): Medico {
    const medico = this.repository.buscarPorId(id);
    if (!medico) throw new NaoEncontradoError(`Médico ${id} não encontrado`);
    return medico;
  }
}
