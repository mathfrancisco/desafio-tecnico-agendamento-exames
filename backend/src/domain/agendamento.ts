export interface Agendamento {
  id: number;
  pacienteNome: string;
  exameId: number;
  medicoId: number;
  inicio: string; // YYYY-MM-DDTHH:mm, hora local da clínica
  fim: string; // inicio + duração do exame (RN1)
  criadoEm: string; // ISO-8601 UTC
}

export type NovoAgendamento = Omit<Agendamento, 'id' | 'criadoEm'>;
