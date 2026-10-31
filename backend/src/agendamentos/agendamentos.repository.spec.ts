import { criarBanco } from '../database/database.module';
import { ConflitoError } from '../shared/erros';
import {
  AgendamentosRepository,
  NovoAgendamento,
} from './agendamentos.repository';

const novo = (parcial: Partial<NovoAgendamento>): NovoAgendamento => ({
  pacienteNome: 'Maria Silva',
  exameId: 7,
  medicoId: 1,
  inicio: '2026-11-03T09:20',
  fim: '2026-11-03T10:00',
  ...parcial,
});

describe('AgendamentosRepository', () => {
  let repository: AgendamentosRepository;

  beforeEach(() => {
    repository = new AgendamentosRepository(criarBanco(':memory:'));
  });

  it('insere e devolve o agendamento com id e criadoEm', () => {
    const criado = repository.inserirSeLivre(novo({}));
    expect(criado).toMatchObject({ id: 1, ...novo({}) });
    expect(criado.criadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  it.each([
    ['idêntico', '2026-11-03T09:20', '2026-11-03T10:00'],
    ['começa dentro', '2026-11-03T09:40', '2026-11-03T10:20'],
    ['termina dentro', '2026-11-03T09:00', '2026-11-03T09:40'],
    ['contém o existente', '2026-11-03T09:00', '2026-11-03T10:30'],
    ['contido no existente', '2026-11-03T09:30', '2026-11-03T09:50'],
  ])('rejeita sobreposição (%s) com ConflitoError', (_caso, inicio, fim) => {
    repository.inserirSeLivre(novo({}));
    expect(() => repository.inserirSeLivre(novo({ inicio, fim }))).toThrow(
      ConflitoError,
    );
    expect(repository.listarDoDia(1, '2026-11-03')).toHaveLength(1);
  });

  it('permite intervalos que apenas encostam', () => {
    repository.inserirSeLivre(novo({}));
    repository.inserirSeLivre(
      novo({ inicio: '2026-11-03T08:40', fim: '2026-11-03T09:20' }),
    );
    repository.inserirSeLivre(
      novo({ inicio: '2026-11-03T10:00', fim: '2026-11-03T10:40' }),
    );
    expect(repository.listarDoDia(1, '2026-11-03')).toHaveLength(3);
  });

  it('não conflita com outro médico nem com outro dia', () => {
    repository.inserirSeLivre(novo({}));
    repository.inserirSeLivre(novo({ medicoId: 2 }));
    repository.inserirSeLivre(
      novo({ inicio: '2026-11-04T09:20', fim: '2026-11-04T10:00' }),
    );
    expect(repository.listarDoDia(1, '2026-11-03')).toHaveLength(1);
    expect(repository.listarDoDia(2, '2026-11-03')).toHaveLength(1);
    expect(repository.listarDoDia(1, '2026-11-04')).toHaveLength(1);
  });

  it('listarDoDia devolve em ordem de início', () => {
    repository.inserirSeLivre(
      novo({ inicio: '2026-11-03T14:00', fim: '2026-11-03T14:40' }),
    );
    repository.inserirSeLivre(novo({}));
    expect(
      repository.listarDoDia(1, '2026-11-03').map((a) => a.inicio),
    ).toEqual(['2026-11-03T09:20', '2026-11-03T14:00']);
  });
});
