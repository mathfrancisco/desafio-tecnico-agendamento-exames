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
  private readonly sobreposto: Database.Statement<[number, string, string]>;
  private readonly inserir: Database.Statement<
    [string, number, number, string, string, string]
  >;
  private readonly doPeriodo: Database.Statement<
    [{ medicoId: number | null; desde: string; ate: string }]
  >;
  private readonly porId: Database.Statement<[number]>;
  private readonly apagar: Database.Statement<[number]>;
  private readonly inserirAtomico: Database.Transaction<
    (novo: NovoAgendamento) => Agendamento
  >;

  constructor(db: Database.Database) {
    this.sobreposto = db.prepare(
      `SELECT 1 FROM agendamentos
        WHERE medico_id = ? AND inicio < ? AND fim > ?
        LIMIT 1`,
    );
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

    // BEGIN IMMEDIATE: o lock de escrita é tomado antes da checagem, então
    // checar e inserir formam uma unidade indivisível mesmo entre processos.
    this.inserirAtomico = db.transaction((novo: NovoAgendamento) => {
      if (this.sobreposto.get(novo.medicoId, novo.fim, novo.inicio)) {
        throw new ConflitoError('Horário indisponível para este médico');
      }
      const criadoEm = new Date().toISOString();
      const { lastInsertRowid } = this.inserir.run(
        novo.pacienteNome,
        novo.exameId,
        novo.medicoId,
        novo.inicio,
        novo.fim,
        criadoEm,
      );
      return { id: Number(lastInsertRowid), ...novo, criadoEm };
    });
  }

  inserirSeLivre(novo: NovoAgendamento): Agendamento {
    return this.inserirAtomico.immediate(novo);
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
