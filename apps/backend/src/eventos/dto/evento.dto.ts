import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EstadoEvento {
  COTIZACION = 'COTIZACION',
  CONFIRMADO = 'CONFIRMADO',
  EN_CURSO = 'EN_CURSO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

export enum TipoEvento {
  BODA = 'BODA',
  CONFERENCIA = 'CONFERENCIA',
  CUMPLEANOS = 'CUMPLEANOS',
  REUNION_CORPORATIVA = 'REUNION_CORPORATIVA',
  CENA_GALA = 'CENA_GALA',
  COCTEL = 'COCTEL',
  OTRO = 'OTRO',
}

export class CreateEventoDto {
  @ApiProperty() @IsString() nombreEvento: string;
  @ApiProperty({ enum: TipoEvento }) @IsEnum(TipoEvento) tipoEvento: TipoEvento;
  @ApiProperty() @IsString() clienteNombre: string;
  @ApiProperty() @IsString() clienteContacto: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clienteRif?: string;
  @ApiProperty() @IsDateString() fechaInicio: string;
  @ApiProperty() @IsDateString() fechaFin: string;
  @ApiProperty() @IsNumber() @Min(1) numeroPersonas: number;
  @ApiProperty() @IsString() salonId: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() serviciosAdicionales?: string[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) adelantoUsd?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() precioPersonaUsd?: number;
}

export class UpdateEventoDto {
  @ApiPropertyOptional() @IsOptional() @IsEnum(EstadoEvento) estado?: EstadoEvento;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() numeroPersonas?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() precioPersonaUsd?: number;
}

export class CreateSalonDto {
  @ApiProperty() @IsString() nombre: string;
  @ApiProperty() @IsNumber() capacidadMaxima: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() precioHoraUsd?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() equipamiento?: string;
}
