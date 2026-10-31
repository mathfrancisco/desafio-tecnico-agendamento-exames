export type DiaSemana = 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB' | 'DOM';

// Índice = Date.getUTCDay() (domingo = 0).
const DIAS: DiaSemana[] = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

export function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function deMinutos(minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** Aceita apenas datas reais no formato YYYY-MM-DD (rejeita 2026-02-30). */
export function ehDataReal(data: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!m) return false;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    d.getUTCFullYear() === ano &&
    d.getUTCMonth() === mes - 1 &&
    d.getUTCDate() === dia
  );
}

/** Aceita apenas meses no formato YYYY-MM. */
export function ehMes(valor: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
}

/** Todas as datas YYYY-MM-DD do mês YYYY-MM, em ordem. */
export function diasDoMes(mes: string): string[] {
  const [ano, numero] = mes.split('-').map(Number);
  const total = new Date(Date.UTC(ano, numero, 0)).getUTCDate();
  return Array.from(
    { length: total },
    (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`,
  );
}

/** Aceita apenas data e hora reais no formato YYYY-MM-DDTHH:mm. */
export function ehDataHoraReal(valor: string): boolean {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(valor);
  if (!m) return false;
  return ehDataReal(m[1]) && Number(m[2]) <= 23 && Number(m[3]) <= 59;
}

/** Calculado a partir do texto da data, sem depender do fuso da máquina. */
export function diaDaSemana(data: string): DiaSemana {
  const [ano, mes, dia] = data.split('-').map(Number);
  return DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
}
