import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoAsiento } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateDetalleAsientoDto {
  @ApiProperty({ example: 'uuid-cuenta-caja' })
  @IsString()
  @IsNotEmpty()
  cuentaId!: string;

  @ApiPropertyOptional({ example: 'Ingreso efectivo habitación 101' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 120.00 })
  @IsNumber()
  debeUsd!: number;

  @ApiProperty({ example: 0.00 })
  @IsNumber()
  haberUsd!: number;
}

export class CreateAsientoDto {
  @ApiProperty({ example: 'uuid-periodo-contable' })
  @IsString()
  @IsNotEmpty()
  periodoId!: string;

  @ApiProperty({ example: '2026-11-05' })
  @IsDateString()
  fecha!: string;

  @ApiProperty({ example: 'Cierre de ventas y folios del día' })
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @ApiPropertyOptional({ enum: TipoAsiento, default: TipoAsiento.MANUAL })
  @IsOptional()
  @IsEnum(TipoAsiento)
  tipo?: TipoAsiento = TipoAsiento.MANUAL;

  @ApiProperty({ type: [CreateDetalleAsientoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleAsientoDto)
  detalles!: CreateDetalleAsientoDto[];
}
