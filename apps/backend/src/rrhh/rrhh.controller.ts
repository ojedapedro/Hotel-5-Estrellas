import {
  Controller, Get, Post, Body, Param, Patch, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RrhhService } from './rrhh.service';
import {
  CreateEmpleadoDto,
  UpdateEmpleadoDto,
  CreateNominaDto,
  RegistrarVacacionesDto,
  EstadoEmpleado,
} from './dto/rrhh.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('RRHH')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rrhh')
export class RrhhController {
  constructor(private readonly rrhhService: RrhhService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs de RRHH' })
  getKPIs() { return this.rrhhService.getKPIs(); }

  @Get('departamentos')
  @ApiOperation({ summary: 'Resumen de empleados por departamento' })
  getDepartamentos() { return this.rrhhService.getDepartamentos(); }

  // ─── EMPLEADOS ───────────────────────────────────────────────────────────────

  @Post('empleados')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'RRHH_NOMINA')
  @ApiOperation({ summary: 'Crear empleado' })
  createEmpleado(@Body() dto: CreateEmpleadoDto, @CurrentUser() user: any) {
    return this.rrhhService.createEmpleado(dto, user.sub);
  }

  @Get('empleados')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'RRHH_NOMINA', 'CONTADOR')
  @ApiOperation({ summary: 'Listar empleados' })
  @ApiQuery({ name: 'estado', enum: EstadoEmpleado, required: false })
  @ApiQuery({ name: 'departamento', required: false })
  findAllEmpleados(
    @Query('estado') estado?: EstadoEmpleado,
    @Query('departamento') departamento?: string,
  ) {
    return this.rrhhService.findAllEmpleados(estado, departamento);
  }

  @Get('empleados/:id')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'RRHH_NOMINA')
  @ApiOperation({ summary: 'Obtener empleado por ID' })
  findOneEmpleado(@Param('id') id: string) {
    return this.rrhhService.findOneEmpleado(id);
  }

  @Patch('empleados/:id')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'RRHH_NOMINA')
  @ApiOperation({ summary: 'Actualizar empleado' })
  updateEmpleado(@Param('id') id: string, @Body() dto: UpdateEmpleadoDto) {
    return this.rrhhService.updateEmpleado(id, dto);
  }

  @Post('vacaciones')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'RRHH_NOMINA')
  @ApiOperation({ summary: 'Registrar período de vacaciones' })
  registrarVacaciones(@Body() dto: RegistrarVacacionesDto, @CurrentUser() user: any) {
    return this.rrhhService.registrarVacaciones(dto, user.sub);
  }

  // ─── NÓMINA ──────────────────────────────────────────────────────────────────

  @Post('nominas')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'RRHH_NOMINA')
  @ApiOperation({ summary: 'Calcular nómina del período' })
  createNomina(@Body() dto: CreateNominaDto, @CurrentUser() user: any) {
    return this.rrhhService.createNomina(dto, user.sub);
  }

  @Get('nominas')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'RRHH_NOMINA', 'CONTADOR')
  @ApiOperation({ summary: 'Historial de nóminas' })
  findAllNominas() { return this.rrhhService.findAllNominas(); }

  @Get('nominas/:id')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'RRHH_NOMINA', 'CONTADOR')
  @ApiOperation({ summary: 'Detalle de nómina' })
  findOneNomina(@Param('id') id: string) { return this.rrhhService.findOneNomina(id); }

  @Patch('nominas/:id/aprobar')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL')
  @ApiOperation({ summary: 'Aprobar nómina' })
  aprobarNomina(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rrhhService.aprobarNomina(id, user.sub);
  }

  @Patch('nominas/:id/pagar')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL')
  @ApiOperation({ summary: 'Marcar nómina como pagada' })
  pagarNomina(@Param('id') id: string) { return this.rrhhService.pagarNomina(id); }
}
