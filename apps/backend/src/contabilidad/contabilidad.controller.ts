import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContabilidadService } from './contabilidad.service';
import { CreateAsientoDto } from './dto/asiento.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('contabilidad')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contabilidad')
export class ContabilidadController {
  constructor(private contabilidadService: ContabilidadService) {}

  @Get('chart-of-accounts')
  @ApiOperation({ summary: 'Obtener el catálogo del plan de cuentas parametrizable' })
  async getPlanCuentas() {
    const data = await this.contabilidadService.getPlanCuentas();
    return { data };
  }

  @Get('asientos')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR)
  @ApiOperation({ summary: 'Listar asientos contables en moneda dual' })
  async getAsientos(@Query('periodoId') periodoId?: string) {
    const data = await this.contabilidadService.getAsientos(periodoId);
    return { data };
  }

  @Post('asientos')
  @Roles(Role.SUPER_ADMIN, Role.CONTADOR)
  @ApiOperation({ summary: 'Crear asiento contable con verificación obligatoria de partida doble' })
  async createAsiento(
    @Body() dto: CreateAsientoDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.contabilidadService.createAsiento(dto, userId);
    return { success: true, data, message: 'Asiento contable registrado exitosamente' };
  }

  @Post('periodos/:id/close')
  @Roles(Role.SUPER_ADMIN, Role.CONTADOR)
  @ApiOperation({ summary: 'Cerrar y bloquear período contable (inmutable)' })
  async closePeriodo(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.contabilidadService.closePeriodo(id, userId);
    return { success: true, data, message: 'Período contable cerrado exitosamente' };
  }

  @Get('pnl/:periodoId')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR, Role.SOCIO)
  @ApiOperation({ summary: 'Obtener Estado de Resultados (P&L) en USD y Bolívares' })
  async getEstadoResultados(@Param('periodoId') periodoId: string) {
    const data = await this.contabilidadService.getEstadoResultados(periodoId);
    return { data };
  }
}
