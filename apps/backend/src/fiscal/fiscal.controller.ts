import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FiscalService } from './fiscal.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { EmitirFacturaFiscalDto, GenerarComprobanteRetencionDto } from './dto/fiscal.dto';

@Controller('fiscal')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  // ─── FACTURAS FISCALES ────────────────────────────────────────────────────

  @Post('facturas')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR, Role.RECEPCIONISTA)
  emitirFactura(@Body() dto: EmitirFacturaFiscalDto) {
    return this.fiscalService.emitirFacturaFiscal(dto);
  }

  // ─── LIBRO DE VENTAS ──────────────────────────────────────────────────────

  @Get('libro-ventas')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR)
  getLibroVentas(
    @Query('anio', ParseIntPipe) anio: number,
    @Query('mes', ParseIntPipe) mes: number,
  ) {
    return this.fiscalService.getLibroVentas(anio, mes);
  }

  // ─── LIBRO DE COMPRAS ─────────────────────────────────────────────────────

  @Get('libro-compras')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR)
  getLibroCompras(
    @Query('anio', ParseIntPipe) anio: number,
    @Query('mes', ParseIntPipe) mes: number,
  ) {
    return this.fiscalService.getLibroCompras(anio, mes);
  }

  // ─── RETENCIONES ──────────────────────────────────────────────────────────

  @Post('retenciones')
  @Roles(Role.SUPER_ADMIN, Role.CONTADOR)
  generarRetencion(@Body() dto: GenerarComprobanteRetencionDto) {
    return this.fiscalService.generarComprobanteRetencion(dto);
  }

  @Get('retenciones')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR)
  getRetenciones(@Query('periodoFiscal') periodoFiscal?: string) {
    return this.fiscalService.getComprobantesRetencion(periodoFiscal);
  }

  // ─── CALENDARIO FISCAL ────────────────────────────────────────────────────

  @Get('calendario')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR)
  getCalendario() {
    return this.fiscalService.getCalendarioFiscal();
  }

  // ─── RESUMEN FISCAL ───────────────────────────────────────────────────────

  @Get('resumen')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR)
  getResumen(
    @Query('anio', ParseIntPipe) anio: number,
    @Query('mes', ParseIntPipe) mes: number,
  ) {
    return this.fiscalService.getResumenFiscal(anio, mes);
  }
}
