import {
  Controller, Get, Post, Body, Param, Patch, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ComprasService } from './compras.service';
import {
  CreateOrdenCompraDto,
  AprobarOrdenDto,
  RecibirOrdenDto,
  CreateProveedorDto,
  EstadoOrdenCompra,
} from './dto/compra.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Compras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  // ─── PROVEEDORES ────────────────────────────────────────────────────────────

  @Post('proveedores')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'COMPRAS_ALMACEN')
  @ApiOperation({ summary: 'Crear proveedor' })
  createProveedor(@Body() dto: CreateProveedorDto, @CurrentUser() user: any) {
    return this.comprasService.createProveedor(dto, user.sub);
  }

  @Get('proveedores')
  @ApiOperation({ summary: 'Listar proveedores' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  findAllProveedores(@Query('activo') activo?: string) {
    const activoFlag = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.comprasService.findAllProveedores(activoFlag);
  }

  @Get('proveedores/:id')
  @ApiOperation({ summary: 'Obtener proveedor por ID' })
  findOneProveedor(@Param('id') id: string) {
    return this.comprasService.findOneProveedor(id);
  }

  // ─── ARTÍCULOS ───────────────────────────────────────────────────────────────

  @Get('articulos')
  @ApiOperation({ summary: 'Catálogo de artículos para compras' })
  @ApiQuery({ name: 'categoriaId', required: false })
  @ApiQuery({ name: 'search', required: false })
  getArticulos(@Query('categoriaId') categoriaId?: string, @Query('search') search?: string) {
    return this.comprasService.getArticulos(categoriaId, search);
  }

  // ─── ÓRDENES DE COMPRA ───────────────────────────────────────────────────────

  @Post('ordenes')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'COMPRAS_ALMACEN')
  @ApiOperation({ summary: 'Crear orden de compra' })
  createOrden(@Body() dto: CreateOrdenCompraDto, @CurrentUser() user: any) {
    return this.comprasService.createOrden(dto, user.sub);
  }

  @Get('ordenes')
  @ApiOperation({ summary: 'Listar órdenes de compra' })
  @ApiQuery({ name: 'estado', enum: EstadoOrdenCompra, required: false })
  @ApiQuery({ name: 'proveedorId', required: false })
  findAllOrdenes(
    @Query('estado') estado?: EstadoOrdenCompra,
    @Query('proveedorId') proveedorId?: string,
  ) {
    return this.comprasService.findAllOrdenes(estado, proveedorId);
  }

  @Get('ordenes/:id')
  @ApiOperation({ summary: 'Obtener orden de compra por ID' })
  findOneOrden(@Param('id') id: string) {
    return this.comprasService.findOneOrden(id);
  }

  @Patch('ordenes/:id/aprobar')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL')
  @ApiOperation({ summary: 'Aprobar orden de compra' })
  aprobarOrden(@Param('id') id: string, @Body() dto: AprobarOrdenDto, @CurrentUser() user: any) {
    return this.comprasService.aprobarOrden(id, dto, user.sub);
  }

  @Post('ordenes/:id/recibir')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL', 'COMPRAS_ALMACEN')
  @ApiOperation({ summary: 'Registrar recepción de mercancía' })
  recibirOrden(@Param('id') id: string, @Body() dto: RecibirOrdenDto, @CurrentUser() user: any) {
    return this.comprasService.recibirOrden(id, dto, user.sub);
  }

  @Patch('ordenes/:id/cancelar')
  @Roles('SUPER_ADMIN', 'GERENTE_GENERAL')
  @ApiOperation({ summary: 'Cancelar orden de compra' })
  cancelarOrden(
    @Param('id') id: string,
    @Body() body: { motivo: string },
    @CurrentUser() user: any,
  ) {
    return this.comprasService.cancelarOrden(id, body.motivo, user.sub);
  }
}
