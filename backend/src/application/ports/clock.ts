export const CLOCK = Symbol('CLOCK');

export interface Clock {
  /** Data e hora atuais na clínica, no formato YYYY-MM-DDTHH:mm. */
  agoraLocal(): string;
}
