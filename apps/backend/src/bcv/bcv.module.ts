import { Module } from '@nestjs/common';
import { BcvService } from './bcv.service';
import { BcvController } from './bcv.controller';

@Module({
  controllers: [BcvController],
  providers: [BcvService],
  exports: [BcvService],
})
export class BcvModule {}
