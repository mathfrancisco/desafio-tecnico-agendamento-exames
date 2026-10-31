import type Database from 'better-sqlite3';
import type { AgendamentosRepository } from '../../application/ports/agendamentos.repository';
import type { Agendamento, NovoAgendamento } from '../../domain/agendamento';
import { ConflitoError } from '../../domain/erros';

interface Linha {
  id: number;
  paciente_nome: string;
  exame_id: number;
  medico_id: number;
  inicio: string;
  fim: string;
  criado_em: string;
}

// Código que o better-sqlite3 dá ao RAISE(ABORT) do trigger agendamentos_sem_sobreposicao.
const SOBREPOSICAO = 'SQLITE_CONSTRAINT_TRIGGER';

const paraAgendamento = (l: Linha): Agendamento => ({
  id: l.id,
  pacienteNome: l.paciente_nome,
  exameId: l.exame_id,
  medicoId: l.medico_id,
  inicio: l.inicio,
  fim: l.fim,
  criadoEm: l.criado_em,
});

export class AgendamentosSqliteRepository implements AgendamentosRepository {
  private readonly inserir: Database.Statement<
    [string, number, number, string, string, string]
  >;
  private readonly doPeriodo: Database.Statement<
    [{ medicoId: number | null; desde: string; ate: string }]
  >;
  private readonly porId: Database.Statement<[number]>;
  private readonly apagar: Database.Statement<[number]>;

  constructor(db: Database.Database) {
    this.inserir = db.prepare(
      `INSERT INTO agendamentos
         (paciente_nome, exame_id, medico_id, inicio, fim, criado_em)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    this.doPeriodo = db.prepare(
      `SELECT * FROM agendamentos
        WHERE inicio >= @desde AND inicio <= @ate
          AND (@medicoId IS NULL OR medico_id = @medicoId)
        ORDER BY inicio`,
    );
    this.porId = db.prepare('SELECT * FROM agendamentos WHERE id = ?');
    this.apagar = db.prepare('DELETE FROM agendamentos WHERE id = ?');
  }

  /** A checagem de sobreposição é do trigger no banco; aqui só traduz o erro. */
  inserirSeLivre(novo: NovoAgendamento): Agendamento {
    const criadoEm = new Date().toISOString();
    try {
      const { lastInsertRowid } = this.inserir.run(
        novo.pacienteNome,
        novo.exameId,
        novo.medicoId,
        novo.inicio,
        novo.fim,
        criadoEm,
      );
      return { id: Number(lastInsertRowid), ...novo, criadoEm };
    } catch (erro) {
      if ((erro as { code?: unknown }).code === SOBREPOSICAO) {
        throw new ConflitoError('Horário indisponível para este médico');
      }
      throw erro;
    }
  }

  listarPorPeriodo(
    medicoId: number | undefined,
    desde: string,
    ate: string,
  ): Agendamento[] {
    const linhas = this.doPeriodo.all({
      medicoId: medicoId ?? null,
      desde: `${desde}T00:00`,
      ate: `${ate}T23:59`,
    }) as Linha[];
    return linhas.map(paraAgendamento);
  }

  obter(id: number): Agendamento | undefined {
    const linha = this.porId.get(id) as Linha | undefined;
    return linha && paraAgendamento(linha);
  }

  remover(id: number): void {
    this.apagar.run(id);
  }
}
