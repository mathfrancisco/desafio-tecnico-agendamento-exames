import { Module } from '@nestjs/common';
import { ExamesModule } from './exames/exames.module';

@Module({ imports: [ExamesModule] })
export class AppModule {}
