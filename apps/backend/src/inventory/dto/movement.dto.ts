import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMovimientoInventario } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateMovementDto {
  @ApiProperty({ example: 'uuid-articulo-1' })
  @IsString()
  @IsNotEmpty()
  articuloId!: string;

  @ApiPropertyOptional({ example: 'uuid-almacen-origen' })
  @IsOptional()
  @IsString()
  almacenOrigenId?: string;

  @ApiPropertyOptional({ example: 'uuid-almacen-destino' })
  @IsOptional()
  @IsString()
  almacenDestinoId?: string;

  @ApiProperty({ enum: TipoMovimientoInventario, example: TipoMovimientoInventario.ENTRADA_COMPRA })
  @IsEnum(TipoMovimientoInventario)
  @IsNotEmpty()
  tipo!: TipoMovimientoInventario;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsPositive()
  cantidad!: number;

  @ApiPropertyOptional({ example: 4.50 })
  @IsOptional()
  @IsNumber()
  costoUnitarioUsd?: number;

  @ApiPropertyOptional({ example: 'Factura Compra Prov-123' })
  @IsOptional()
  @IsString()
  referenciaDocumento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;
}
