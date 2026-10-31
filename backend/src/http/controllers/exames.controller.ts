import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BuscarExames } from '../../application/use-cases/buscar-exames';
import { ApiErros } from '../api-erros';
import { BuscarExamesQuery } from '../dto/buscar-exames.query';
import { ExameResposta } from '../dto/respostas';

@ApiTags('Exames')
@Controller('exames')
export class ExamesController {
  constructor(private readonly buscarExames: BuscarExames) {}

  @Get()
  @ApiOperation({
    summary: 'Busca exames pelo nome',
    description: 'Sem `nome`, devolve o catálogo inteiro. Ordenado por nome.',
  })
  @ApiOkResponse({ type: [ExameResposta] })
  @ApiErros(400)
  buscar(@Query() { nome }: BuscarExamesQuery) {
    return this.buscarExames.executar(nome);
  }
}
