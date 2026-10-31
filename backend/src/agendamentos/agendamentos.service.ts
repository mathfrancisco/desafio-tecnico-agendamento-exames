import { Inject, Injectable } from '@nestjs/common';
import { ExamesService } from '../exames/exames.service';
import { MedicosService } from '../medicos/medicos.service';
import { CLOCK, type Clock } from '../shared/clock';
import { RegraNegocioError } from '../shared/erros';
import { Agendamento, AgendamentosRepository } from './agendamentos.repository';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';
import { gerarHorarios } from './gerar-horarios';

@Injectable()
export class AgendamentosService {
  constructor(
    private readonly medicos: MedicosService,
    private readonly exames: ExamesService,
    private readonly repository: AgendamentosRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  criar(dto: CriarAgendamentoDto): Agendamento {
    const exame = this.exames.obter(dto.exameId);
    const medico = this.medicos.obter(dto.medicoId);

    if (dto.inicio <= this.clock.agoraLocal()) {
      throw new RegraNegocioError(
        'Não é possível agendar em data e hora que já passaram',
      );
    }

    // PR2: o início precisa ser um dos horários da grade do médico (turnos, sem agendamentos).
    const data = dto.inicio.slice(0, 10);
    const hora = dto.inicio.slice(11);
    const horario = gerarHorarios(
      this.medicos.turnosDoDia(medico, data),
      exame.duracaoMinutos,
      [],
    ).find((h) => h.inicio === hora);
    if (!horario) {
      throw new RegraNegocioError(
        'Horário fora do expediente ou fora da grade do médico para este exame',
      );
    }

    return this.repository.inserirSeLivre({
      pacienteNome: dto.pacienteNome,
      exameId: exame.id,
      medicoId: medico.id,
      inicio: dto.inicio,
      fim: `${data}T${horario.fim}`,
    });
  }
}
