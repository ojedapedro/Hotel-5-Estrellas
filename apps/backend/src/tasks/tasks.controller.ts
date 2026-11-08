import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NightAuditService } from './night-audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('tasks')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private nightAuditService: NightAuditService) {}

  @Post('night-audit/run')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.AUDITOR_NOCTURNO)
  @ApiOperation({ summary: 'Ejecutar manualmente la auditoría nocturna (aplica cargos de habitación a folios)' })
  async runNightAudit(@CurrentUser('email') userEmail: string) {
    const data = await this.nightAuditService.runNightAudit(userEmail);
    return { success: true, data, message: 'Auditoría nocturna ejecutada con éxito' };
  }

  @Get('night-audit/history')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.AUDITOR_NOCTURNO, Role.CONTADOR)
  @ApiOperation({ summary: 'Historial de auditorías nocturnas ejecutadas' })
  async getHistory() {
    const data = await this.nightAuditService.getHistory();
    return { data };
  }
}
