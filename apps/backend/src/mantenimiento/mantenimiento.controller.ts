import {
  Controller, Get, Post, Body, Param, Patch, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MantenimientoService } from './mantenimiento.service';
import {
  CreateOrdenTrabajoDto,
  ActualizarOrdenTrabajoDto,
  ActualizarHousekeepingDto,
  EstadoOrdenTrabajo,
  TipoOrdenTrabajo,
  PrioridadOrden,
} from './dto/mantenimiento.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Mantenimiento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mantenimiento')
export class MantenimientoController {
  constructor(private readonly mantenimientoService: MantenimientoService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs de mantenimiento y housekeeping' })
  getKPIs() { return this.mantenimientoService.getKPIs(); }

  // ─── HOUSEKEEPING ────────────────────────────────────────────────────────────

  @Get('housekeeping')
  @ApiOperation({ summary: 'Estado housekeeping de todas las habitaciones' })
  getEstadoHousekeeping() { return this.mantenimientoService.getEstadoHousekeeping(); }

  @Get('housekeeping/pendiente')
  @ApiOperation({ summary: 'Habitaciones pendientes de limpieza' })
  getPendienteHousekeeping() { return this.mantenimientoService.getPendienteHousekeeping(); }

  @Patch('housekeeping')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'TECNICO_MANTENIMIENTO', 'RECEPCIONISTA')
  @ApiOperation({ summary: 'Actualizar estado de housekeeping de habitación' })
  actualizarHousekeeping(@Body() dto: ActualizarHousekeepingDto, @CurrentUser() user: any) {
    return this.mantenimientoService.actualizarHousekeeping(dto, user.sub);
  }

  // ─── ÓRDENES DE TRABAJO ──────────────────────────────────────────────────────

  @Post('ordenes')
  @ApiOperation({ summary: 'Crear orden de trabajo' })
  createOrden(@Body() dto: CreateOrdenTrabajoDto, @CurrentUser() user: any) {
    return this.mantenimientoService.createOrden(dto, user.sub);
  }

  @Get('ordenes')
  @ApiOperation({ summary: 'Listar órdenes de trabajo' })
  @ApiQuery({ name: 'estado', enum: EstadoOrdenTrabajo, required: false })
  @ApiQuery({ name: 'tipo', enum: TipoOrdenTrabajo, required: false })
  @ApiQuery({ name: 'prioridad', enum: PrioridadOrden, required: false })
  @ApiQuery({ name: 'asignadoAId', required: false })
  findAllOrdenes(
    @Query('estado') estado?: EstadoOrdenTrabajo,
    @Query('tipo') tipo?: TipoOrdenTrabajo,
    @Query('prioridad') prioridad?: PrioridadOrden,
    @Query('asignadoAId') asignadoAId?: string,
  ) {
    return this.mantenimientoService.findAllOrdenes(estado, tipo, prioridad, asignadoAId);
  }

  @Get('ordenes/:id')
  @ApiOperation({ summary: 'Obtener orden de trabajo por ID' })
  findOneOrden(@Param('id') id: string) {
    return this.mantenimientoService.findOneOrden(id);
  }

  @Patch('ordenes/:id')
  @ApiOperation({ summary: 'Actualizar orden de trabajo' })
  actualizarOrden(
    @Param('id') id: string,
    @Body() dto: ActualizarOrdenTrabajoDto,
    @CurrentUser() user: any,
  ) {
    return this.mantenimientoService.actualizarOrden(id, dto, user.sub);
  }
}
