import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SociosService } from './socios.service';
import {
  CreateSocioDto,
  SimularDistribucionDto,
  RegistrarPagoSocioDto,
} from './dto/socios.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('socios')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('socios')
export class SociosController {
  constructor(private readonly sociosService: SociosService) {}

  // ─── SOCIOS ──────────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR, Role.SOCIO)
  @ApiOperation({ summary: 'Listar socios y composición accionaria (100% total)' })
  async getSocios() {
    return this.sociosService.getSocios();
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Registrar nuevo socio accionista' })
  async createSocio(@Body() dto: CreateSocioDto) {
    return this.sociosService.createSocio(dto);
  }

  // ─── DISTRIBUCIONES ──────────────────────────────────────────────────────────

  @Get('distribuciones')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR, Role.SOCIO)
  @ApiOperation({ summary: 'Listar historial de distribuciones de dividendos' })
  async findAllDistribuciones() {
    return this.sociosService.findAllDistribuciones();
  }

  @Get('distribuciones/:id')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR, Role.SOCIO)
  @ApiOperation({ summary: 'Detalle de distribución con desglose por socio' })
  async findOneDistribucion(@Param('id') id: string) {
    return this.sociosService.findOneDistribucion(id);
  }

  @Post('distribuciones/simular')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR)
  @ApiOperation({
    summary: 'Ejecutar simulación mensual de dividendos con reserva de $50k USD',
  })
  async simularDistribucion(
    @Body() dto: SimularDistribucionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sociosService.simularDistribucion(dto, userId);
  }

  @Patch('distribuciones/:id/aprobar')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR)
  @ApiOperation({ summary: 'Aprobar simulación de dividendos (Contador / Gerente)' })
  async aprobarDistribucion(
    @Param('id') id: string,
    @CurrentUser('rol') rol: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sociosService.aprobarDistribucion(id, rol, userId);
  }

  @Patch('distribuciones/:id/cerrar-inmutable')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL)
  @ApiOperation({
    summary:
      'Cierre inmutable: congela la distribución y genera asiento contable automático',
  })
  async cerrarDistribucionInmutable(@Param('id') id: string) {
    return this.sociosService.cerrarDistribucionInmutable(id);
  }

  @Patch('distribuciones/:distribucionId/socios/:socioId/pagar')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR)
  @ApiOperation({ summary: 'Registrar transferencia bancaria o pago de dividendo a socio' })
  async registrarPagoSocio(
    @Param('distribucionId') distribucionId: string,
    @Param('socioId') socioId: string,
    @Body() dto: RegistrarPagoSocioDto,
  ) {
    return this.sociosService.registrarPagoSocio(distribucionId, socioId, dto);
  }

  // ─── PORTAL DEL SOCIO ────────────────────────────────────────────────────────

  @Get('portal/:socioId')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR, Role.SOCIO)
  @ApiOperation({
    summary: 'Portal de inversionista (vista de solo lectura para el accionista)',
  })
  async getPortalSocio(@Param('socioId') socioId: string) {
    return this.sociosService.getPortalSocio(socioId);
  }
}
