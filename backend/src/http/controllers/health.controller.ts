import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  VERIFICADOR_SAUDE,
  type VerificadorSaude,
} from '../../application/ports/saude';
import { SaudeResposta } from '../dto/respostas';

@ApiTags('Saúde')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(VERIFICADOR_SAUDE) private readonly saude: VerificadorSaude,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verifica se a API e o banco respondem' })
  @ApiOkResponse({ type: SaudeResposta })
  @ApiServiceUnavailableResponse({
    description: 'Banco indisponível',
    type: SaudeResposta,
  })
  verificar(): SaudeResposta {
    try {
      this.saude.verificar();
    } catch {
      throw new ServiceUnavailableException({ status: 'erro' });
    }
    return { status: 'ok' };
  }
}
