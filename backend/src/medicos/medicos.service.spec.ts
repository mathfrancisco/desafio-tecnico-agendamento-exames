import { NaoEncontradoError } from '../domain/erros';
import { MedicosRepository } from './medicos.repository';
import { MedicosService } from './medicos.service';

const resumo = (id: number) =>
  service
    .obter(id)
    .turnos.map((t) => `${t.dia} ${t.inicio}-${t.fim}`)
    .join(', ');

const service = new MedicosService(new MedicosRepository());

describe('MedicosService', () => {
  it('lista os 5 médicos', () => {
    expect(service.listar().map((m) => [m.id, m.nome, m.crm])).toEqual([
      [1, 'Dra. Helena Marques', 'CRM-MG 11111'],
      [2, 'Dr. Rafael Teixeira', 'CRM-MG 22222'],
      [3, 'Dra. Beatriz Nogueira', 'CRM-MG 33333'],
      [4, 'Dr. Thiago Fontes', 'CRM-MG 44444'],
      [5, 'Dra. Camila Andrade', 'CRM-MG 55555'],
    ]);
  });

  it('Helena: segunda a sexta, manhã e tarde', () => {
    expect(resumo(1)).toBe(
      'SEG 08:00-12:00, SEG 14:00-18:00, TER 08:00-12:00, TER 14:00-18:00, ' +
        'QUA 08:00-12:00, QUA 14:00-18:00, QUI 08:00-12:00, QUI 14:00-18:00, ' +
        'SEX 08:00-12:00, SEX 14:00-18:00',
    );
  });

  it('Rafael: seg/qua/sex manhã, ter/qui tarde', () => {
    expect(resumo(2)).toBe(
      'SEG 07:00-13:00, TER 13:00-19:00, QUA 07:00-13:00, QUI 13:00-19:00, SEX 07:00-13:00',
    );
  });

  it('Beatriz: segunda a quinta, manhã e noite', () => {
    expect(resumo(3)).toBe(
      'SEG 09:00-12:00, SEG 18:00-22:00, TER 09:00-12:00, TER 18:00-22:00, ' +
        'QUA 09:00-12:00, QUA 18:00-22:00, QUI 09:00-12:00, QUI 18:00-22:00',
    );
  });

  it('Thiago: terça a sábado de manhã, noite na quarta e sexta', () => {
    expect(resumo(4)).toBe(
      'TER 08:00-12:00, QUA 08:00-12:00, QUA 19:00-22:00, QUI 08:00-12:00, ' +
        'SEX 08:00-12:00, SEX 19:00-22:00, SAB 08:00-12:00',
    );
  });

  it('Camila: 10-14 em dias úteis, sábado de manhã', () => {
    expect(resumo(5)).toBe(
      'SEG 10:00-14:00, TER 10:00-14:00, QUA 10:00-14:00, QUI 10:00-14:00, ' +
        'SEX 10:00-14:00, SAB 08:00-12:00',
    );
  });

  it('obter lança NaoEncontradoError para id inexistente', () => {
    expect(() => service.obter(99)).toThrow(NaoEncontradoError);
  });
});
