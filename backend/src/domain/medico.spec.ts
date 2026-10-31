import { Medico, turnosDoDia } from './medico';

const medico: Medico = {
  id: 4,
  nome: 'Dr. Thiago Fontes',
  crm: 'CRM-MG 44444',
  turnos: [
    { dia: 'QUA', inicio: '08:00', fim: '12:00' },
    { dia: 'QUA', inicio: '19:00', fim: '22:00' },
    { dia: 'QUI', inicio: '08:00', fim: '12:00' },
  ],
};

describe('turnosDoDia', () => {
  it('usa o dia da semana da data', () => {
    // 2026-11-04 é quarta-feira; 2026-11-02 é segunda-feira.
    expect(turnosDoDia(medico, '2026-11-04')).toHaveLength(2);
    expect(turnosDoDia(medico, '2026-11-02')).toEqual([]);
  });
});
