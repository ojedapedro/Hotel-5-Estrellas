import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSocioDto {
  @ApiProperty() @IsString() nombre: string;
  @ApiProperty() @IsString() rif: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefono?: string;
  @ApiProperty({ description: 'Porcentaje de participación societaria (ej: 75.00)' })
  @IsNumber()
  @Min(0.01)
  @Max(100.0)
  porcentajeParticipacion: number;
  @ApiPropertyOptional() @IsOptional() @IsString() banco?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numeroCuenta?: string;
}

export class SimularDistribucionDto {
  @ApiProperty({ description: 'Nombre descriptivo del período (ej: Noviembre 2026)' })
  @IsString()
  periodoNombre: string;

  @ApiProperty({ example: 2026 })
  @IsNumber()
  anio: number;

  @ApiProperty({ example: 11 })
  @IsNumber()
  @Min(1)
  @Max(12)
  mes: number;

  @ApiPropertyOptional({
    enum: ['UTILIDAD_CONTABLE', 'CAJA_DISPONIBLE'],
    default: 'UTILIDAD_CONTABLE',
  })
  @IsOptional()
  @IsEnum(['UTILIDAD_CONTABLE', 'CAJA_DISPONIBLE'])
  baseCalculo?: 'UTILIDAD_CONTABLE' | 'CAJA_DISPONIBLE';

  @ApiPropertyOptional({
    description: 'Reserva operativa de liquidez obligatoria previa en USD (def: $50,000 USD)',
    default: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservaLiquidezMinimaUsd?: number;
}

export class RegistrarPagoSocioDto {
  @ApiProperty({ description: 'Número de referencia bancaria de la transferencia' })
  @IsString()
  referenciaPago: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fechaPago?: string;
}
