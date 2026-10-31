import { MEDICOS, MedicosFake } from '../testing/fakes';
import { ListarMedicos } from './listar-medicos';

describe('ListarMedicos', () => {
  it('devolve os médicos do repositório', () => {
    expect(new ListarMedicos(new MedicosFake()).executar()).toEqual(MEDICOS);
  });
});
