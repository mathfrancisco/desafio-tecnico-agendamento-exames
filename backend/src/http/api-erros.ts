import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErroResposta } from './dto/respostas';

const DESCRICAO_ERRO = {
  400: 'Parâmetro ou corpo inválido',
  404: 'Exame, médico ou agendamento inexistente',
  409: 'Horário já ocupado',
  422: 'Regra de negócio violada (passado, fora da grade, já iniciado)',
} as const;

/** Documenta no Swagger as respostas de erro que a rota pode devolver. */
export const ApiErros = (...codigos: (keyof typeof DESCRICAO_ERRO)[]) =>
  applyDecorators(
    ...codigos.map((status) =>
      ApiResponse({
        status,
        description: DESCRICAO_ERRO[status],
        type: ErroResposta,
      }),
    ),
  );
