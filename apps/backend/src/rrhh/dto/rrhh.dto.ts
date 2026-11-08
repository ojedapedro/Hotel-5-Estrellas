import {
  IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min, IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EstadoEmpleado {
  ACTIVO = 'ACTIVO',
  VACACIONES = 'VACACIONES',
  REPOSO = 'REPOSO',
  RETIRADO = 'RETIRADO',
  SUSPENDIDO = 'SUSPENDIDO',
}

export enum TipoContrato {
  FIJO = 'FIJO',
  DETERMINADO = 'DETERMINADO',
  HONORARIOS = 'HONORARIOS',
  PASANTIA = 'PASANTIA',
}

export enum EstadoNomina {
  BORRADOR = 'BORRADOR',
  CALCULADA = 'CALCULADA',
  APROBADA = 'APROBADA',
  PAGADA = 'PAGADA',
}

export class CreateEmpleadoDto {
  @ApiProperty() @IsString() cedula: string;
  @ApiProperty() @IsString() nombre: string;
  @ApiProperty() @IsString() apellido: string;
  @ApiProperty() @IsString() cargo: string;
  @ApiProperty() @IsString() departamento: string;
  @ApiProperty() @IsDateString() fechaIngreso: string;
  @ApiProperty() @IsNumber() @Min(0) salarioBaseUsd: number;
  @ApiProperty({ enum: TipoContrato }) @IsEnum(TipoContrato) tipoContrato: TipoContrato;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefono?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() banco?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numeroCuenta?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tipoMonedaCuenta?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() usuarioId?: string;
}

export class UpdateEmpleadoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() cargo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departamento?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salarioBaseUsd?: number;
  @ApiPropertyOptional() @IsOptional() @IsEnum(EstadoEmpleado) estado?: EstadoEmpleado;
  @ApiPropertyOptional() @IsOptional() @IsString() banco?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numeroCuenta?: string;
}

export class CreateNominaDto {
  @ApiProperty() @IsString() periodoNombre: string;  // "Noviembre 2026"
  @ApiProperty() @IsDateString() fechaDesde: string;
  @ApiProperty() @IsDateString() fechaHasta: string;
  @ApiProperty() @IsDateString() fechaPago: string;
}

export class AgregarConceptoDto {
  @ApiProperty() @IsString() empleadoId: string;
  @ApiProperty() @IsString() concepto: string;
  @ApiProperty() @IsEnum(['ASIGNACION', 'DEDUCCION']) tipo: 'ASIGNACION' | 'DEDUCCION';
  @ApiProperty() @IsNumber() @Min(0) montoUsd: number;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
}

export class RegistrarVacacionesDto {
  @ApiProperty() @IsString() empleadoId: string;
  @ApiProperty() @IsDateString() fechaInicio: string;
  @ApiProperty() @IsDateString() fechaFin: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
}
