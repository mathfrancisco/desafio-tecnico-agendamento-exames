import { gerarHorarios, Intervalo } from './gerar-horarios';

const MANHA: Intervalo = { inicio: '08:00', fim: '12:00' };
const inicios = (horarios: Intervalo[]) => horarios.map((h) => h.inicio);

describe('gerarHorarios', () => {
  describe('exemplos do enunciado (turno 08:00–12:00)', () => {
    it('exame de 40 min', () => {
      expect(inicios(gerarHorarios([MANHA], 40, []))).toEqual([
        '08:00',
        '08:40',
        '09:20',
        '10:00',
        '10:40',
        '11:20',
      ]);
    });

    it('exame de 30 min', () => {
      expect(inicios(gerarHorarios([MANHA], 30, []))).toEqual([
        '08:00',
        '08:30',
        '09:00',
        '09:30',
        '10:00',
        '10:30',
        '11:00',
        '11:30',
      ]);
    });

    it('exame de 20 min', () => {
      const horarios = gerarHorarios([MANHA], 20, []);
      expect(horarios).toHaveLength(12);
      expect(horarios[0]).toEqual({ inicio: '08:00', fim: '08:20' });
      expect(horarios[1].inicio).toBe('08:20');
      expect(horarios[2].inicio).toBe('08:40');
      // O último vale porque termina às 12:00, ainda dentro do turno.
      expect(horarios[11]).toEqual({ inicio: '11:40', fim: '12:00' });
    });
  });

  it('informa o fim de cada horário (início + duração)', () => {
    expect(gerarHorarios([MANHA], 40, [])[1]).toEqual({
      inicio: '08:40',
      fim: '09:20',
    });
  });

  it('remove apenas o horário que colide com o bloco 09:20–10:00', () => {
    const ocupados = [{ inicio: '09:20', fim: '10:00' }];
    expect(inicios(gerarHorarios([MANHA], 40, ocupados))).toEqual([
      '08:00',
      '08:40',
      '10:00',
      '10:40',
      '11:20',
    ]);
  });

  it('agendamento desalinhado de outra duração remove todos os horários que ele cruza', () => {
    // Exame de 30 min às 09:00–09:30 e, agora, exame de 40 min: a grade segue
    // contada a partir das 08:00 e 08:40 e 09:20 cruzam o bloco existente.
    const ocupados = [{ inicio: '09:00', fim: '09:30' }];
    expect(inicios(gerarHorarios([MANHA], 40, ocupados))).toEqual([
      '08:00',
      '10:00',
      '10:40',
      '11:20',
    ]);
  });

  it('intervalos que apenas encostam são permitidos', () => {
    const ocupados = [{ inicio: '08:40', fim: '09:20' }];
    const livres = inicios(gerarHorarios([MANHA], 40, ocupados));
    expect(livres).toContain('08:00'); // termina 08:40, quando o outro começa
    expect(livres).toContain('09:20'); // começa 09:20, quando o outro termina
    expect(livres).not.toContain('08:40');
  });

  it('gera horários em cada turno do dia, com a grade reiniciando no início do turno', () => {
    const turnos = [{ inicio: '14:00', fim: '18:00' }, MANHA];
    const livres = inicios(gerarHorarios(turnos, 40, []));
    expect(livres).toEqual([
      '08:00',
      '08:40',
      '09:20',
      '10:00',
      '10:40',
      '11:20',
      '14:00',
      '14:40',
      '15:20',
      '16:00',
      '16:40',
      '17:20',
    ]);
  });

  it('descarta o horário final que estouraria o turno', () => {
    // 09:00–12:00 tem 180 min: 4 blocos de 40; o quinto terminaria 12:20.
    const turno = { inicio: '09:00', fim: '12:00' };
    expect(inicios(gerarHorarios([turno], 40, []))).toEqual([
      '09:00',
      '09:40',
      '10:20',
      '11:00',
    ]);
  });

  it('agenda cheia devolve lista vazia', () => {
    const ocupados = [{ inicio: '08:00', fim: '12:00' }];
    expect(gerarHorarios([MANHA], 30, ocupados)).toEqual([]);
  });

  it('sem turnos devolve lista vazia', () => {
    expect(gerarHorarios([], 30, [])).toEqual([]);
  });
});
