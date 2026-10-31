import type Database from 'better-sqlite3';
import type { VerificadorSaude } from '../../application/ports/saude';

export class SaudeSqlite implements VerificadorSaude {
  constructor(private readonly db: Database.Database) {}

  verificar(): void {
    this.db.prepare('SELECT 1').get();
  }
}
