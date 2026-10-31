import { FUSO_CLINICA } from '../config';

export const CLOCK = Symbol('CLOCK');

export interface Clock {
  /** Data e hora atuais na clínica, no formato YYYY-MM-DDTHH:mm. */
  agoraLocal(): string;
}

export class SystemClock implements Clock {
  private readonly formato = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_CLINICA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  agoraLocal(): string {
    const p: Record<string, string> = {};
    for (const parte of this.formato.formatToParts(new Date())) {
      p[parte.type] = parte.value;
    }
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }
}
