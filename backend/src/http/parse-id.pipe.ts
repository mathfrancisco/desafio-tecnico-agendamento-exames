import { BadRequestException, ParseIntPipe } from '@nestjs/common';

/** `ParseIntPipe` com a mensagem em português, como os outros 400 da API. */
export const parseId = (nome: string) =>
  new ParseIntPipe({
    exceptionFactory: () =>
      new BadRequestException(`${nome} deve ser um número inteiro`),
  });
