import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CanalReserva, MetodoPago, Moneda } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateGuestDto {
  @ApiProperty({ example: 'Carlos' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ example: 'Rodríguez' })
  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @ApiProperty({ example: 'CEDULA' })
  @IsString()
  @IsNotEmpty()
  documentoTipo!: string;

  @ApiProperty({ example: 'V-15890123' })
  @IsString()
  @IsNotEmpty()
  documentoNum!: string;

  @ApiPropertyOptional({ example: 'carlos.rodriguez@email.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+58 414 5551234' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'Venezolana' })
  @IsOptional()
  @IsString()
  nacionalidad?: string;
}

export class CreateReservationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  huespedId?: string;

  @ApiPropertyOptional({ type: CreateGuestDto })
  @IsOptional()
  huesped?: CreateGuestDto;

  @ApiProperty({ example: 'uuid-hab-101' })
  @IsString()
  @IsNotEmpty()
  habitacionId!: string;

  @ApiProperty({ example: 'uuid-tarifa-rack' })
  @IsString()
  @IsNotEmpty()
  tarifaId!: string;

  @ApiProperty({ example: '2026-11-10' })
  @IsDateString()
  fechaLlegada!: string;

  @ApiProperty({ example: '2026-11-15' })
  @IsDateString()
  fechaSalida!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  adultos?: number = 1;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ninos?: number = 0;

  @ApiPropertyOptional({ enum: CanalReserva, default: CanalReserva.MOSTRADOR })
  @IsOptional()
  @IsEnum(CanalReserva)
  canal?: CanalReserva = CanalReserva.MOSTRADOR;

  @ApiPropertyOptional({ example: 50.00 })
  @IsOptional()
  @IsNumber()
  montoAnticipo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;
}

export class AddFolioChargeDto {
  @ApiProperty({ example: 'Consumo Minibar - Agua y snacks' })
  @IsString()
  @IsNotEmpty()
  concepto!: string;

  @ApiProperty({ example: 15.00 })
  @IsNumber()
  @IsPositive()
  montoUsd!: number;

  @ApiPropertyOptional({ example: 'MINIBAR' })
  @IsOptional()
  @IsString()
  tipo?: string;
}

export class AddFolioPaymentDto {
  @ApiProperty({ enum: MetodoPago, example: MetodoPago.EFECTIVO_USD })
  @IsEnum(MetodoPago)
  @IsNotEmpty()
  metodoPago!: MetodoPago;

  @ApiProperty({ example: 100.00 })
  @IsNumber()
  @IsPositive()
  monto!: number;

  @ApiProperty({ enum: Moneda, example: Moneda.USD })
  @IsEnum(Moneda)
  moneda!: Moneda;

  @ApiPropertyOptional({ example: 'REF-789012' })
  @IsOptional()
  @IsString()
  referencia?: string;
}
