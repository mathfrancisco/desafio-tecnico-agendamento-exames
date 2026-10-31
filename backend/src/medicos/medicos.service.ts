import { Injectable } from '@nestjs/common';
import { NaoEncontradoError } from '../shared/erros';
import { diaDaSemana } from '../shared/tempo';
import { Medico, Turno } from './medicos.data';
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

  /** Turnos do médico no dia da semana de `data` (YYYY-MM-DD). */
  turnosDoDia(medico: Medico, data: string): Turno[] {
    const dia = diaDaSemana(data);
    return medico.turnos.filter((turno) => turno.dia === dia);
  }
}
