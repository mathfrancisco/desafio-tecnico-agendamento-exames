import { Controller, Get } from '@nestjs/common';
import { MedicosService } from './medicos.service';

@Controller('medicos')
export class MedicosController {
  constructor(private readonly service: MedicosService) {}

  @Get()
  listar() {
    return this.service.listar();
  }
}
