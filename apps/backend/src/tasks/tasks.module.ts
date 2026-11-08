import { Module } from '@nestjs/common';
import { NightAuditService } from './night-audit.service';
import { TasksController } from './tasks.controller';
import { BcvModule } from '../bcv/bcv.module';

@Module({
  imports: [BcvModule],
  controllers: [TasksController],
  providers: [NightAuditService],
  exports: [NightAuditService],
})
export class TasksModule {}
