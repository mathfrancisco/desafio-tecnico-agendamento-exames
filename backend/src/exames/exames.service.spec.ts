import { NaoEncontradoError } from '../shared/erros';
import { ExamesRepository } from './exames.repository';
import { ExamesService } from './exames.service';

describe('ExamesService', () => {
  const service = new ExamesService(new ExamesRepository());

  it('sem nome devolve o catálogo inteiro ordenado por nome', () => {
    const exames = service.buscar();
    expect(exames).toHaveLength(30);
    const nomes = exames.map((e) => e.nome);
    expect(nomes).toEqual(
      [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    );
  });

  it('ignora acentos e maiúsculas', () => {
    expect(service.buscar('ressonancia')).toHaveLength(4);
    expect(service.buscar('RESSONÂNCIA')).toHaveLength(4);
  });

  it('encontra por trecho do nome', () => {
    const ids = service.buscar('joelho').map((e) => e.id);
    expect(ids.sort((a, b) => a - b)).toEqual([4, 21]);
  });

  it('devolve lista vazia quando nada casa', () => {
    expect(service.buscar('xyz')).toEqual([]);
  });

  it('obter lança NaoEncontradoError para id inexistente', () => {
    expect(() => service.obter(999)).toThrow(NaoEncontradoError);
    expect(service.obter(1).nome).toBe('Raio-X de Tórax');
  });
});
