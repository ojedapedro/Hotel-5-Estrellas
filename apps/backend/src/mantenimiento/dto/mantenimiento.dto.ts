import { IsString, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipoOrdenTrabajo {
  MANTENIMIENTO_CORRECTIVO = 'MANTENIMIENTO_CORRECTIVO',
  MANTENIMIENTO_PREVENTIVO = 'MANTENIMIENTO_PREVENTIVO',
  LIMPIEZA = 'LIMPIEZA',
  REPARACION = 'REPARACION',
  INSTALACION = 'INSTALACION',
}

export enum PrioridadOrden {
  BAJA = 'BAJA',
  NORMAL = 'NORMAL',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

export enum EstadoOrdenTrabajo {
  PENDIENTE = 'PENDIENTE',
  ASIGNADA = 'ASIGNADA',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

export enum EstadoHousekeeping {
  LIMPIA = 'LIMPIA',
  SUCIA = 'SUCIA',
  EN_LIMPIEZA = 'EN_LIMPIEZA',
  BLOQUEADA = 'BLOQUEADA',
}

export class CreateOrdenTrabajoDto {
  @ApiProperty({ enum: TipoOrdenTrabajo }) @IsEnum(TipoOrdenTrabajo) tipo: TipoOrdenTrabajo;
  @ApiProperty({ enum: PrioridadOrden }) @IsEnum(PrioridadOrden) prioridad: PrioridadOrden;
  @ApiProperty() @IsString() descripcion: string;
  @ApiPropertyOptional() @IsOptional() @IsString() habitacionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() areaComun?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() asignadoAId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fechaProgramada?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() repuestosNecesarios?: string[];
}

export class ActualizarOrdenTrabajoDto {
  @ApiPropertyOptional() @IsOptional() @IsEnum(EstadoOrdenTrabajo) estado?: EstadoOrdenTrabajo;
  @ApiPropertyOptional() @IsOptional() @IsString() asignadoAId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notasTecnico?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() resolucion?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() repuestosUsados?: string[];
}

export class ActualizarHousekeepingDto {
  @ApiProperty() @IsString() habitacionId: string;
  @ApiProperty({ enum: EstadoHousekeeping }) @IsEnum(EstadoHousekeeping) estado: EstadoHousekeeping;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
}
