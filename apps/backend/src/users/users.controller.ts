import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Crear nuevo empleado o usuario' })
  async create(@Body() dto: CreateUserDto, @CurrentUser('id') creatorId: string) {
    const data = await this.usersService.create(dto, creatorId);
    return { success: true, data, message: 'Usuario creado exitosamente' };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.RRHH_NOMINA)
  @ApiOperation({ summary: 'Listar usuarios con paginación y búsqueda' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.RRHH_NOMINA)
  @ApiOperation({ summary: 'Obtener detalle de usuario por ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return { data };
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Actualizar información de usuario' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.update(id, dto);
    return { success: true, data, message: 'Usuario actualizado exitosamente' };
  }

  @Patch(':id/toggle-active')
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL)
  @ApiOperation({ summary: 'Activar o desactivar usuario (soft delete)' })
  async toggleActive(@Param('id') id: string) {
    const data = await this.usersService.toggleActive(id);
    return { success: true, data, message: `Usuario ${data.activo ? 'activado' : 'desactivado'}` };
  }
}
