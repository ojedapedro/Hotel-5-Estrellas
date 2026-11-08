import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BcvService } from './bcv.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsNumber, IsPositive } from 'class-validator';

class SetRateDto {
  @IsNumber()
  @IsPositive()
  tasaUsd!: number;
}

@ApiTags('bcv')
@Controller('bcv')
export class BcvController {
  constructor(private bcvService: BcvService) {}

  @Get('current')
  @ApiOperation({ summary: 'Obtener la tasa de cambio BCV oficial vigente' })
  async getCurrentRate() {
    const data = await this.bcvService.getCurrentRate();
    return { data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.GERENTE_GENERAL, Role.CONTADOR)
  @ApiBearerAuth('JWT')
  @Post('override')
  @ApiOperation({ summary: 'Ajustar o fijar manualmente la tasa BCV' })
  async setRate(@Body() dto: SetRateDto) {
    const data = await this.bcvService.setRate(dto.tasaUsd);
    return { success: true, data, message: 'Tasa BCV actualizada exitosamente' };
  }
}
