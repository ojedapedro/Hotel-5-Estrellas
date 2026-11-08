import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FoliosService } from './folios.service';
import { AddFolioChargeDto, AddFolioPaymentDto } from '../dto/reservation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('folios')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pms/folios')
export class FoliosController {
  constructor(private foliosService: FoliosService) {}

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.RECEPCIONISTA, Role.CONTADOR, Role.AUDITOR_NOCTURNO)
  @ApiOperation({ summary: 'Obtener detalle de folio con estado de cuenta, cargos y pagos en moneda dual' })
  async getFolio(@Param('id') id: string) {
    const data = await this.foliosService.getFolio(id);
    return { data };
  }

  @Post(':id/charges')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.RECEPCIONISTA, Role.CAJERO_POS)
  @ApiOperation({ summary: 'Cargar consumo manual o de servicio al folio del huésped' })
  async addCharge(
    @Param('id') id: string,
    @Body() dto: AddFolioChargeDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.foliosService.addCharge(id, dto, userId);
    return { success: true, data, message: 'Cargo registrado exitosamente en el folio' };
  }

  @Post(':id/payments')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.RECEPCIONISTA, Role.CONTADOR)
  @ApiOperation({ summary: 'Registrar abono o pago a folio con cálculo automático de IGTF (3% en divisas)' })
  async addPayment(
    @Param('id') id: string,
    @Body() dto: AddFolioPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.foliosService.addPayment(id, dto, userId);
    return { success: true, data, message: 'Pago registrado exitosamente' };
  }
}
