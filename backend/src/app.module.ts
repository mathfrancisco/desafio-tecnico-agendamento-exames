import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import type Database from 'better-sqlite3';
import { AGENDAMENTOS_REPOSITORY } from './application/ports/agendamentos.repository';
import { CLOCK } from './application/ports/clock';
import { EXAMES_REPOSITORY } from './application/ports/exames.repository';
import { MEDICOS_REPOSITORY } from './application/ports/medicos.repository';
import { BuscarExames } from './application/use-cases/buscar-exames';
import { ConsultarHorarios } from './application/use-cases/consultar-horarios';
import { CriarAgendamento } from './application/use-cases/criar-agendamento';
import { ListarMedicos } from './application/use-cases/listar-medicos';
import { config } from './config';
import { AgendamentosController } from './http/controllers/agendamentos.controller';
import { ExamesController } from './http/controllers/exames.controller';
import { MedicosController } from './http/controllers/medicos.controller';
import { SystemClock } from './infrastructure/clock/system-clock';
import { ExamesCsvRepository } from './infrastructure/csv/exames-csv.repository';
import { MedicosMemoriaRepository } from './infrastructure/memoria/medicos-memoria.repository';
import { AgendamentosSqliteRepository } from './infrastructure/sqlite/agendamentos-sqlite.repository';
import { criarBanco, DATABASE } from './infrastructure/sqlite/database';

/** Registra um use case construído com as dependências dos tokens em `inject`. */
function casoDeUso<T>(
  classe: new (...dependencias: any[]) => T,
  inject: symbol[],
) {
  return {
    provide: classe,
    useFactory: (...dependencias: unknown[]) => new classe(...dependencias),
    inject,
  };
}

// Raiz de composição: único lugar que liga ports a adapters e use cases a dependências.
@Module({
  controllers: [ExamesController, MedicosController, AgendamentosController],
  providers: [
    { provide: DATABASE, useFactory: () => criarBanco(config().dbPath) },
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: EXAMES_REPOSITORY,
      useFactory: () => new ExamesCsvRepository(config().examesCsvPath),
    },
    { provide: MEDICOS_REPOSITORY, useClass: MedicosMemoriaRepository },
    {
      provide: AGENDAMENTOS_REPOSITORY,
      useFactory: (db: Database.Database) =>
        new AgendamentosSqliteRepository(db),
      inject: [DATABASE],
    },
    casoDeUso(BuscarExames, [EXAMES_REPOSITORY]),
    casoDeUso(ListarMedicos, [MEDICOS_REPOSITORY]),
    casoDeUso(ConsultarHorarios, [
      MEDICOS_REPOSITORY,
      EXAMES_REPOSITORY,
      AGENDAMENTOS_REPOSITORY,
      CLOCK,
    ]),
    casoDeUso(CriarAgendamento, [
      MEDICOS_REPOSITORY,
      EXAMES_REPOSITORY,
      AGENDAMENTOS_REPOSITORY,
      CLOCK,
    ]),
  ],
})
export class AppModule implements OnModuleDestroy {
  constructor(@Inject(DATABASE) private readonly db: Database.Database) {}

  onModuleDestroy() {
    this.db.close();
  }
}
