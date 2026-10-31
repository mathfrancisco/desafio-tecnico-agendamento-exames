import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import { config } from '../config';

export const DATABASE = Symbol('DATABASE');

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS agendamentos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_nome TEXT    NOT NULL,
    exame_id      INTEGER NOT NULL,
    medico_id     INTEGER NOT NULL,
    inicio        TEXT    NOT NULL,
    fim           TEXT    NOT NULL,
    criado_em     TEXT    NOT NULL,
    CHECK (fim > inicio)
  );
  CREATE INDEX IF NOT EXISTS idx_agendamentos_medico_inicio
    ON agendamentos (medico_id, inicio);
`;

export function criarBanco(caminho: string): Database.Database {
  const db = new Database(caminho);
  db.exec(SCHEMA);
  return db;
}

@Module({
  providers: [
    { provide: DATABASE, useFactory: () => criarBanco(config().dbPath) },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DATABASE) private readonly db: Database.Database) {}

  onModuleDestroy() {
    this.db.close();
  }
}
