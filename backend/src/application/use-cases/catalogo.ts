import { NaoEncontradoError } from '../../domain/erros';
import type { Exame } from '../../domain/exame';
import type { Medico } from '../../domain/medico';
import type { ExamesRepository } from '../ports/exames.repository';
import type { MedicosRepository } from '../ports/medicos.repository';

export function obterExame(repository: ExamesRepository, id: number): Exame {
  const exame = repository.buscarPorId(id);
  if (!exame) throw new NaoEncontradoError(`Exame ${id} não encontrado`);
  return exame;
}

export function obterMedico(repository: MedicosRepository, id: number): Medico {
  const medico = repository.buscarPorId(id);
  if (!medico) throw new NaoEncontradoError(`Médico ${id} não encontrado`);
  return medico;
}
