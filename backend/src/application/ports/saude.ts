export const VERIFICADOR_SAUDE = Symbol('VERIFICADOR_SAUDE');

export interface VerificadorSaude {
  /** Lança erro se alguma dependência essencial (o banco) não responder. */
  verificar(): void;
}
