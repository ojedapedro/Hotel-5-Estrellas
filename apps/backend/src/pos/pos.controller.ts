import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreateComandaDto, PayComandaDto } from './dto/comanda.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('pos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pos')
export class PosController {
  constructor(private posService: PosService) {}

  @Get('points-of-sale')
  @ApiOperation({ summary: 'Listar puntos de venta y plano de mesas con estado' })
  async getPuntosVenta() {
    const data = await this.posService.getPuntosVenta();
    return { data };
  }

  @Get('menu')
  @ApiOperation({ summary: 'Obtener catálogo del menú categorizado con precios' })
  async getMenu() {
    const data = await this.posService.getMenu();
    return { data };
  }

  @Post('comandas')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CAJERO_POS, Role.MESERO)
  @ApiOperation({ summary: 'Crear nueva comanda para mesa o servicio' })
  async createComanda(
    @Body() dto: CreateComandaDto,
    @CurrentUser('id') meseroId: string,
  ) {
    const data = await this.posService.createComanda(dto, meseroId);
    return { success: true, data, message: 'Comanda creada con éxito' };
  }

  @Post('comandas/:id/send-to-kitchen')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CAJERO_POS, Role.MESERO)
  @ApiOperation({ summary: 'Enviar comanda a la cocina (emite orden en tiempo real por WebSocket)' })
  async sendToKitchen(@Param('id') id: string) {
    const data = await this.posService.sendToKitchen(id);
    return { success: true, data, message: 'Comanda enviada a cocina' };
  }

  @Post('comandas/:id/pay')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CAJERO_POS)
  @ApiOperation({ summary: 'Cobrar comanda con cobro mixto o cargo a folio de habitación' })
  async payComanda(
    @Param('id') id: string,
    @Body() dto: PayComandaDto,
    @CurrentUser('id') cajeroId: string,
  ) {
    return this.posService.payComanda(id, dto, cajeroId);
  }
}
