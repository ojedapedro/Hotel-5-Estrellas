import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { FilterRoomsDto, UpdateRoomStatusDto } from '../dto/room.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('rooms')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pms/rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get('map')
  @Roles(
    Role.SUPER_ADMIN,
    Role.GERENTE_GENERAL,
    Role.RECEPCIONISTA,
    Role.AUDITOR_NOCTURNO,
    Role.TECNICO_MANTENIMIENTO,
  )
  @ApiOperation({ summary: 'Obtener el mapa interactivo de las 200 habitaciones con estado y KPIs en vivo' })
  async getHotelMap() {
    return this.roomsService.getHotelMap();
  }

  @Get()
  @ApiOperation({ summary: 'Listar habitaciones filtradas por piso, tipo o estado' })
  async findAll(@Query() filter: FilterRoomsDto) {
    const data = await this.roomsService.findAll(filter);
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de habitación por ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.roomsService.findOne(id);
    return { data };
  }

  @Patch(':id/status')
  @Roles(
    Role.SUPER_ADMIN,
    Role.GERENTE_GENERAL,
    Role.RECEPCIONISTA,
    Role.AUDITOR_NOCTURNO,
    Role.TECNICO_MANTENIMIENTO,
  )
  @ApiOperation({ summary: 'Actualizar el estado de una habitación' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRoomStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.roomsService.updateStatus(id, dto.estado, userId);
    return { success: true, data, message: 'Estado de habitación actualizado' };
  }
}
