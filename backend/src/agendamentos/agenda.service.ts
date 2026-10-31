import { Inject, Injectable } from '@nestjs/common';
import { Intervalo, gerarHorarios } from '../domain/gerar-horarios';
import { turnosDoDia } from '../domain/medico';
import { ExamesService } from '../exames/exames.service';
import { MedicosService } from '../medicos/medicos.service';
import { CLOCK, type Clock } from '../shared/clock';
import { AgendamentosRepository } from './agendamentos.repository';

export interface HorariosLivres {
  medicoId: number;
  exameId: number;
  data: string;
  horarios: Intervalo[];
}

@Injectable()
export class AgendaService {
  constructor(
    private readonly medicos: MedicosService,
    private readonly exames: ExamesService,
    private readonly agendamentos: AgendamentosRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  horariosLivres(
    medicoId: number,
    exameId: number,
    data: string,
  ): HorariosLivres {
    const medico = this.medicos.obter(medicoId);
    const exame = this.exames.obter(exameId);

    const ocupados = this.agendamentos.listarDoDia(medicoId, data).map((a) => ({
      inicio: a.inicio.slice(11),
      fim: a.fim.slice(11),
    }));
    const agora = this.clock.agoraLocal();
    // Datas e horas no formato fixo comparam como texto: passado some, hoje filtra o que já foi.
    const horarios = gerarHorarios(
      turnosDoDia(medico, data),
      exame.duracaoMinutos,
      ocupados,
    ).filter((h) => `${data}T${h.inicio}` > agora);

    return { medicoId, exameId, data, horarios };
  }
}
