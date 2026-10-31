import type { Agendamento } from './agendamento';
import { Medico, turnosDoDia } from './medico';
import { deMinutos, paraMinutos } from './tempo';

/** Intervalo dentro de um dia, em HH:MM. O fim é exclusivo. */
export interface Intervalo {
  inicio: string;
  fim: string;
}

/**
 * Horários livres de um dia (RN2): a partir do início de cada turno, em passos
 * iguais à duração do exame, mantendo os que cabem inteiros no turno e não
 * cruzam nenhum intervalo ocupado. A grade nunca se realinha após um agendamento.
 */
export function gerarHorarios(
  turnos: Intervalo[],
  duracaoMinutos: number,
  ocupados: Intervalo[],
): Intervalo[] {
  const bloqueios = ocupados.map((o) => ({
    inicio: paraMinutos(o.inicio),
    fim: paraMinutos(o.fim),
  }));
  const horarios: Intervalo[] = [];

  const ordenados = [...turnos].sort(
    (a, b) => paraMinutos(a.inicio) - paraMinutos(b.inicio),
  );
  for (const turno of ordenados) {
    const fimTurno = paraMinutos(turno.fim);
    for (
      let inicio = paraMinutos(turno.inicio);
      inicio + duracaoMinutos <= fimTurno;
      inicio += duracaoMinutos
    ) {
      const fim = inicio + duracaoMinutos;
      const colide = bloqueios.some((b) => b.inicio < fim && inicio < b.fim);
      if (!colide) {
        horarios.push({ inicio: deMinutos(inicio), fim: deMinutos(fim) });
      }
    }
  }
  return horarios;
}

/**
 * Horários livres do médico numa data (RN2, RN4, RN5). Datas e horas no formato
 * fixo comparam como texto: dia passado some e, hoje, some o que já começou.
 */
export function horariosLivresDoDia(
  medico: Medico,
  data: string,
  duracaoMinutos: number,
  agendamentosDoDia: Pick<Agendamento, 'inicio' | 'fim'>[],
  agora: string,
): Intervalo[] {
  const ocupados = agendamentosDoDia.map((a) => ({
    inicio: a.inicio.slice(11),
    fim: a.fim.slice(11),
  }));
  return gerarHorarios(
    turnosDoDia(medico, data),
    duracaoMinutos,
    ocupados,
  ).filter((h) => `${data}T${h.inicio}` > agora);
}
