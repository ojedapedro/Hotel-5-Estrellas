import { Module } from '@nestjs/common';
import { RrhhService } from './rrhh.service';
import { RrhhController } from './rrhh.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RrhhController],
  providers: [RrhhService],
  exports: [RrhhService],
})
export class RrhhModule {}
