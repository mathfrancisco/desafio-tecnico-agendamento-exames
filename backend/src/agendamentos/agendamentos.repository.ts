import { Inject, Injectable } from '@nestjs/common';
import type Database from 'better-sqlite3';
import { DATABASE } from '../database/database.module';
import { Agendamento, NovoAgendamento } from '../domain/agendamento';
import { ConflitoError } from '../domain/erros';

interface Linha {
  id: number;
  paciente_nome: string;
  exame_id: number;
  medico_id: number;
  inicio: string;
  fim: string;
  criado_em: string;
}

@Injectable()
export class AgendamentosRepository {
  private readonly sobreposto: Database.Statement<[number, string, string]>;
  private readonly inserir: Database.Statement<
    [string, number, number, string, string, string]
  >;
  private readonly doDia: Database.Statement<[number, string, string]>;
  private readonly inserirAtomico: Database.Transaction<
    (novo: NovoAgendamento) => Agendamento
  >;

  constructor(@Inject(DATABASE) db: Database.Database) {
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
    this.doDia = db.prepare(
      `SELECT * FROM agendamentos
        WHERE medico_id = ? AND inicio >= ? AND inicio <= ?
        ORDER BY inicio`,
    );

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

  /** Agendamentos do médico na data (YYYY-MM-DD), em ordem de início. */
  listarDoDia(medicoId: number, data: string): Agendamento[] {
    const linhas = this.doDia.all(
      medicoId,
      `${data}T00:00`,
      `${data}T23:59`,
    ) as Linha[];
    return linhas.map((l) => ({
      id: l.id,
      pacienteNome: l.paciente_nome,
      exameId: l.exame_id,
      medicoId: l.medico_id,
      inicio: l.inicio,
      fim: l.fim,
      criadoEm: l.criado_em,
    }));
  }
}
