import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoHabitacion, TipoHabitacion } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRoomStatusDto {
  @ApiProperty({ enum: EstadoHabitacion, example: EstadoHabitacion.LIMPIEZA })
  @IsEnum(EstadoHabitacion)
  @IsNotEmpty()
  estado!: EstadoHabitacion;

  @ApiPropertyOptional({ example: 'Limpieza profunda tras checkout' })
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class FilterRoomsDto {
  @ApiPropertyOptional({ enum: EstadoHabitacion })
  @IsOptional()
  @IsEnum(EstadoHabitacion)
  estado?: EstadoHabitacion;

  @ApiPropertyOptional()
  @IsOptional()
  piso?: number;

  @ApiPropertyOptional({ enum: TipoHabitacion })
  @IsOptional()
  @IsEnum(TipoHabitacion)
  tipo?: TipoHabitacion;
}
