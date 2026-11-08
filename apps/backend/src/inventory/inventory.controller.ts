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
import { InventoryService } from './inventory.service';
import { CreateMovementDto } from './dto/movement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('inventory')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('warehouses')
  @ApiOperation({ summary: 'Listar los 5 almacenes del hotel' })
  async getWarehouses() {
    const data = await this.inventoryService.getWarehouses();
    return { data };
  }

  @Get('stock')
  @ApiOperation({ summary: 'Consultar existencias de inventario por almacén o global' })
  async getStock(@Query('almacenId') almacenId?: string) {
    const data = await this.inventoryService.getStock(almacenId);
    return { data };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Obtener alertas de artículos bajo stock mínimo' })
  async getAlerts() {
    const data = await this.inventoryService.getLowStockAlerts();
    return { data };
  }

  @Post('movements')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.COMPRAS_ALMACEN)
  @ApiOperation({ summary: 'Registrar movimiento de entrada/salida/traslado con costo promedio ponderado' })
  async registerMovement(
    @Body() dto: CreateMovementDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.inventoryService.registerMovement(dto, userId);
    return { success: true, data, message: 'Movimiento de inventario registrado exitosamente' };
  }

  @Get('kardex/:articuloId')
  @ApiOperation({ summary: 'Consultar historial de Kardex de un artículo' })
  async getKardex(@Param('articuloId') articuloId: string) {
    const data = await this.inventoryService.getKardex(articuloId);
    return { data };
  }
}
