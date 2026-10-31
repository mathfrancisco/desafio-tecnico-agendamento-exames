import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConflitoError, NaoEncontradoError, RegraNegocioError } from './erros';

@Catch(NaoEncontradoError, RegraNegocioError, ConflitoError)
export class ErrosFilter implements ExceptionFilter {
  catch(erro: Error, host: ArgumentsHost) {
    const [statusCode, error] =
      erro instanceof NaoEncontradoError
        ? [HttpStatus.NOT_FOUND, 'Not Found']
        : erro instanceof ConflitoError
          ? [HttpStatus.CONFLICT, 'Conflict']
          : [HttpStatus.UNPROCESSABLE_ENTITY, 'Unprocessable Entity'];

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({ statusCode, error, message: erro.message });
  }
}
