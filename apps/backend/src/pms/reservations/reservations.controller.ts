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
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from '../dto/reservation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('reservations')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pms/reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Crear nueva reserva hotelera' })
  async create(
    @Body() dto: CreateReservationDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.reservationsService.create(dto, userId);
    return { success: true, data, message: 'Reserva creada exitosamente' };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.RECEPCIONISTA, Role.AUDITOR_NOCTURNO)
  @ApiOperation({ summary: 'Listar reservas con filtros' })
  async findAll(@Query() query: any) {
    const data = await this.reservationsService.findAll(query);
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de reserva por ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.reservationsService.findOne(id);
    return { data };
  }

  @Post(':id/check-in')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Realizar Check-in del huésped (Abre folio y asigna habitación)' })
  async checkIn(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const data = await this.reservationsService.checkIn(id, userId);
    return { success: true, data, message: 'Check-in realizado con éxito' };
  }

  @Post('folio/:folioId/check-out')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.RECEPCIONISTA)
  @ApiOperation({ summary: 'Realizar Check-out (Verifica saldo cero y libera habitación a limpieza)' })
  async checkOut(
    @Param('folioId') folioId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reservationsService.checkOut(folioId, userId);
  }
}
