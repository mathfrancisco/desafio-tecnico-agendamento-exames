import Database from 'better-sqlite3';

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

  -- RN3 no próprio banco: o INSERT de um intervalo que cruza outro do mesmo
  -- médico é abortado. Checagem e escrita rodam no mesmo comando, sob o lock de
  -- escrita do SQLite, então valem para qualquer conexão ou processo.
  CREATE TRIGGER IF NOT EXISTS agendamentos_sem_sobreposicao
  BEFORE INSERT ON agendamentos
  WHEN EXISTS (
    SELECT 1 FROM agendamentos
     WHERE medico_id = NEW.medico_id
       AND inicio < NEW.fim
       AND fim > NEW.inicio
  )
  BEGIN
    SELECT RAISE(ABORT, 'agendamento sobreposto');
  END;
`;

export function criarBanco(caminho: string): Database.Database {
  const db = new Database(caminho);
  // WAL: leituras (horários, disponibilidade) não esperam por escritas em curso.
  // Em ':memory:' o SQLite ignora e segue em modo 'memory'.
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}
