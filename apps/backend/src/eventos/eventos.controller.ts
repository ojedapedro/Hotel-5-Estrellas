import {
  Controller, Get, Post, Body, Param, Patch, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EventosService } from './eventos.service';
import {
  CreateEventoDto,
  UpdateEventoDto,
  CreateSalonDto,
  EstadoEvento,
} from './dto/evento.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Eventos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs del módulo de eventos' })
  getKPIs() { return this.eventosService.getKPIs(); }

  @Get('calendario')
  @ApiOperation({ summary: 'Calendario de eventos' })
  @ApiQuery({ name: 'desde', required: true })
  @ApiQuery({ name: 'hasta', required: true })
  getCalendario(@Query('desde') desde: string, @Query('hasta') hasta: string) {
    return this.eventosService.getCalendario(desde, hasta);
  }

  // ─── SALONES ─────────────────────────────────────────────────────────────────

  @Post('salones')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL')
  @ApiOperation({ summary: 'Crear salón' })
  createSalon(@Body() dto: CreateSalonDto) {
    return this.eventosService.createSalon(dto);
  }

  @Get('salones')
  @ApiOperation({ summary: 'Listar salones disponibles' })
  findAllSalones() { return this.eventosService.findAllSalones(); }

  // ─── EVENTOS ─────────────────────────────────────────────────────────────────

  @Post()
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'EJECUTIVO_EVENTOS')
  @ApiOperation({ summary: 'Crear cotización de evento' })
  createEvento(@Body() dto: CreateEventoDto, @CurrentUser() user: any) {
    return this.eventosService.createEvento(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar eventos' })
  @ApiQuery({ name: 'estado', enum: EstadoEvento, required: false })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  findAllEventos(
    @Query('estado') estado?: EstadoEvento,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.eventosService.findAllEventos(estado, desde, hasta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener evento por ID' })
  findOneEvento(@Param('id') id: string) {
    return this.eventosService.findOneEvento(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'EJECUTIVO_EVENTOS')
  @ApiOperation({ summary: 'Actualizar evento' })
  updateEvento(@Param('id') id: string, @Body() dto: UpdateEventoDto, @CurrentUser() user: any) {
    return this.eventosService.updateEvento(id, dto, user.sub);
  }

  @Patch(':id/confirmar')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'EJECUTIVO_EVENTOS')
  @ApiOperation({ summary: 'Confirmar evento (cotización → confirmado)' })
  confirmarEvento(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventosService.confirmarEvento(id, user.sub);
  }

  @Patch(':id/cancelar')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL')
  @ApiOperation({ summary: 'Cancelar evento' })
  cancelarEvento(@Param('id') id: string, @Body() body: { motivo: string }) {
    return this.eventosService.cancelarEvento(id, body.motivo);
  }
}
