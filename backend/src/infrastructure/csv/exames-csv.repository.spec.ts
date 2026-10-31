import { config } from '../../config';
import { ExamesCsvRepository, parseExamesCsv } from './exames-csv.repository';

describe('parseExamesCsv', () => {
  it('ignora o cabeçalho, linhas em branco e CRLF', () => {
    const csv =
      'id,nome,duracao_minutos\r\n1,Raio-X de Tórax,20\r\n\r\n6,Mamografia Bilateral,30\r\n';
    expect(parseExamesCsv(csv)).toEqual([
      { id: 1, nome: 'Raio-X de Tórax', duracaoMinutos: 20 },
      { id: 6, nome: 'Mamografia Bilateral', duracaoMinutos: 30 },
    ]);
  });

  it('falha se a duração não for numérica', () => {
    expect(() =>
      parseExamesCsv('id,nome,duracao_minutos\n1,Raio-X,abc'),
    ).toThrow(/Linha inválida/);
  });
});

describe('ExamesCsvRepository', () => {
  it('carrega os 30 exames de dados/exames.csv', () => {
    const repository = new ExamesCsvRepository(config().examesCsvPath);
    expect(repository.listar()).toHaveLength(30);
    expect(repository.buscarPorId(20)).toEqual({
      id: 20,
      nome: 'Ressonância Magnética de Crânio',
      duracaoMinutos: 40,
    });
    expect(repository.buscarPorId(999)).toBeUndefined();
  });
});
