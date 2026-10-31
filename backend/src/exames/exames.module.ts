import { Module } from '@nestjs/common';
import { ExamesController } from './exames.controller';
import { ExamesRepository } from './exames.repository';
import { ExamesService } from './exames.service';

@Module({
  controllers: [ExamesController],
  providers: [ExamesRepository, ExamesService],
  exports: [ExamesService],
})
export class ExamesModule {}
