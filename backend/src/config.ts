import * as path from 'node:path';

export const FUSO_CLINICA = 'America/Sao_Paulo';

// Lido sob demanda (não na importação) para que testes possam ajustar o ambiente.
export function config() {
  return {
    port: Number(process.env.PORT ?? 3000),
    dbPath:
      process.env.DB_PATH ?? path.resolve(process.cwd(), 'agendamentos.db'),
    examesCsvPath:
      process.env.EXAMES_CSV_PATH ??
      path.resolve(process.cwd(), '..', 'dados', 'exames.csv'),
    // Só em produção: pasta com o build do front para a API servir.
    frontendDist: process.env.FRONTEND_DIST,
  };
}
