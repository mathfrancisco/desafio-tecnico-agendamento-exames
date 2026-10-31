import { criarBanco } from './database';
import { NovoAgendamento } from '../../domain/agendamento';
import { ConflitoError } from '../../domain/erros';
import { AgendamentosSqliteRepository } from './agendamentos-sqlite.repository';

const novo = (parcial: Partial<NovoAgendamento>): NovoAgendamento => ({
  pacienteNome: 'Maria Silva',
  exameId: 7,
  medicoId: 1,
  inicio: '2026-11-03T09:20',
  fim: '2026-11-03T10:00',
  ...parcial,
});

describe('AgendamentosSqliteRepository', () => {
  let repository: AgendamentosSqliteRepository;

  beforeEach(() => {
    repository = new AgendamentosSqliteRepository(criarBanco(':memory:'));
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
    expect(
      repository.listarPorPeriodo(1, '2026-11-03', '2026-11-03'),
    ).toHaveLength(1);
  });

  it('permite intervalos que apenas encostam', () => {
    repository.inserirSeLivre(novo({}));
    repository.inserirSeLivre(
      novo({ inicio: '2026-11-03T08:40', fim: '2026-11-03T09:20' }),
    );
    repository.inserirSeLivre(
      novo({ inicio: '2026-11-03T10:00', fim: '2026-11-03T10:40' }),
    );
    expect(
      repository.listarPorPeriodo(1, '2026-11-03', '2026-11-03'),
    ).toHaveLength(3);
  });

  it('não conflita com outro médico nem com outro dia', () => {
    repository.inserirSeLivre(novo({}));
    repository.inserirSeLivre(novo({ medicoId: 2 }));
    repository.inserirSeLivre(
      novo({ inicio: '2026-11-04T09:20', fim: '2026-11-04T10:00' }),
    );
    expect(
      repository.listarPorPeriodo(1, '2026-11-03', '2026-11-03'),
    ).toHaveLength(1);
    expect(
      repository.listarPorPeriodo(2, '2026-11-03', '2026-11-03'),
    ).toHaveLength(1);
    expect(
      repository.listarPorPeriodo(1, '2026-11-04', '2026-11-04'),
    ).toHaveLength(1);
  });

  it('listarPorPeriodo devolve em ordem de início', () => {
    repository.inserirSeLivre(
      novo({ inicio: '2026-11-03T14:00', fim: '2026-11-03T14:40' }),
    );
    repository.inserirSeLivre(novo({}));
    expect(
      repository
        .listarPorPeriodo(1, '2026-11-03', '2026-11-03')
        .map((a) => a.inicio),
    ).toEqual(['2026-11-03T09:20', '2026-11-03T14:00']);
  });

  it('listarPorPeriodo filtra por datas inclusivas e por médico opcional', () => {
    const noDia = (dia: string, medicoId: number) =>
      repository.inserirSeLivre(
        novo({
          medicoId,
          inicio: `${dia}T09:00`,
          fim: `${dia}T09:40`,
        }),
      );
    noDia('2026-10-31', 1);
    noDia('2026-11-01', 1);
    noDia('2026-11-15', 2);
    noDia('2026-11-30', 1);
    noDia('2026-12-01', 1);

    const datas = (medicoId?: number) =>
      repository
        .listarPorPeriodo(medicoId, '2026-11-01', '2026-11-30')
        .map((a) => a.inicio.slice(0, 10));
    expect(datas()).toEqual(['2026-11-01', '2026-11-15', '2026-11-30']);
    expect(datas(1)).toEqual(['2026-11-01', '2026-11-30']);
    expect(datas(3)).toEqual([]);
  });

  it('obter devolve o agendamento ou undefined', () => {
    const criado = repository.inserirSeLivre(novo({}));
    expect(repository.obter(criado.id)).toEqual(criado);
    expect(repository.obter(999)).toBeUndefined();
  });

  it('remover apaga o registro e libera o horário', () => {
    const criado = repository.inserirSeLivre(novo({}));
    repository.remover(criado.id);
    expect(repository.obter(criado.id)).toBeUndefined();
    expect(() => repository.inserirSeLivre(novo({}))).not.toThrow();
  });

  it('remover id inexistente não falha', () => {
    expect(() => repository.remover(999)).not.toThrow();
  });
});
