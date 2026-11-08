import { Module } from '@nestjs/common';
import { SociosService } from './socios.service';
import { SociosController } from './socios.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BcvModule } from '../bcv/bcv.module';

@Module({
  imports: [PrismaModule, BcvModule],
  controllers: [SociosController],
  providers: [SociosService],
  exports: [SociosService],
})
export class SociosModule {}
