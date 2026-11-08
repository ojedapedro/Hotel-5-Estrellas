import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoPago, Moneda } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateItemComandaDto {
  @ApiProperty({ example: 'uuid-producto-1' })
  @IsString()
  @IsNotEmpty()
  productoId!: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  cantidad!: number;

  @ApiPropertyOptional({ example: ['Término medio', 'Sin cebolla'] })
  @IsOptional()
  @IsArray()
  modificadores?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;
}

export class CreateComandaDto {
  @ApiProperty({ example: 'uuid-punto-venta-restaurante' })
  @IsString()
  @IsNotEmpty()
  puntoVentaId!: string;

  @ApiPropertyOptional({ example: 'uuid-mesa-1' })
  @IsOptional()
  @IsString()
  mesaId?: string;

  @ApiPropertyOptional({ example: 'uuid-folio-1' })
  @IsOptional()
  @IsString()
  folioId?: string;

  @ApiProperty({ type: [CreateItemComandaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemComandaDto)
  items!: CreateItemComandaDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;
}

export class PayComandaDto {
  @ApiProperty({ enum: MetodoPago, example: MetodoPago.PAGO_MOVIL })
  @IsEnum(MetodoPago)
  @IsNotEmpty()
  metodoPago!: MetodoPago;

  @ApiProperty({ example: 45.00 })
  @IsNumber()
  @IsPositive()
  monto!: number;

  @ApiProperty({ enum: Moneda, example: Moneda.VES })
  @IsEnum(Moneda)
  moneda!: Moneda;

  @ApiPropertyOptional({ example: '04141234567-REF9988' })
  @IsOptional()
  @IsString()
  referencia?: string;

  @ApiPropertyOptional({ example: 'uuid-folio-101' })
  @IsOptional()
  @IsString()
  folioId?: string;
}
