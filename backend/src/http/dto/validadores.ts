import { ValidateBy, ValidationOptions } from 'class-validator';
import { ehDataHoraReal, ehDataReal, ehMes } from '../../domain/tempo';

function validadorDeTexto(
  nome: string,
  teste: (valor: string) => boolean,
  mensagem: string,
) {
  return (opcoes?: ValidationOptions) =>
    ValidateBy(
      {
        name: nome,
        validator: {
          validate: (valor: unknown) =>
            typeof valor === 'string' && teste(valor),
          defaultMessage: () => mensagem,
        },
      },
      opcoes,
    );
}

export const IsDataReal = validadorDeTexto(
  'isDataReal',
  ehDataReal,
  '$property deve ser uma data real no formato YYYY-MM-DD',
);

export const IsMes = validadorDeTexto(
  'isMes',
  ehMes,
  '$property deve ser um mês no formato YYYY-MM',
);

export const IsDataHoraReal = validadorDeTexto(
  'isDataHoraReal',
  ehDataHoraReal,
  '$property deve ser uma data e hora reais no formato YYYY-MM-DDTHH:mm',
);
