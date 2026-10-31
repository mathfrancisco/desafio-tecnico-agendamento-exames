import { ExamesFake } from '../testing/fakes';
import { BuscarExames } from './buscar-exames';

describe('BuscarExames', () => {
  const buscar = new BuscarExames(new ExamesFake());

  it('sem nome devolve o catálogo inteiro ordenado por nome', () => {
    const nomes = buscar.executar().map((e) => e.nome);
    expect(nomes).toHaveLength(4);
    expect(nomes).toEqual(
      [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    );
  });

  it('ignora acentos e maiúsculas', () => {
    expect(buscar.executar('ressonancia')).toHaveLength(2);
    expect(buscar.executar('RESSONÂNCIA')).toHaveLength(2);
  });

  it('encontra por trecho do nome', () => {
    const ids = buscar.executar('joelho').map((e) => e.id);
    expect(ids.sort((a, b) => a - b)).toEqual([4, 21]);
  });

  it('ignora espaços nas pontas', () => {
    expect(buscar.executar('  mamografia ')).toHaveLength(1);
  });

  it('devolve lista vazia quando nada casa', () => {
    expect(buscar.executar('xyz')).toEqual([]);
  });
});
