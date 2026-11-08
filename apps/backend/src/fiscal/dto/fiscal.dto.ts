import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmitirFacturaFiscalDto {
  @ApiProperty({ enum: ['PMS', 'POS', 'EVENTOS', 'MANUAL'] })
  @IsEnum(['PMS', 'POS', 'EVENTOS', 'MANUAL'])
  origenModulo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  origenId?: string;

  @ApiProperty() @IsString() clienteNombre: string;
  @ApiProperty({ example: 'J-12345678-9' }) @IsString() clienteRif: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clienteDireccion?: string;

  @ApiProperty() @IsNumber() @Min(0) baseImponibleUsd: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) exentoUsd?: number;
  @ApiPropertyOptional({ default: 16 }) @IsOptional() @IsNumber() alicuotaIva?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() alicuotaIgtf?: number;
}

export class GenerarComprobanteRetencionDto {
  @ApiProperty({ enum: ['IVA_75', 'IVA_100', 'ISLR'] })
  @IsEnum(['IVA_75', 'IVA_100', 'ISLR'])
  tipoRetencion: 'IVA_75' | 'IVA_100' | 'ISLR';

  @ApiProperty({ example: '2026-11' }) @IsString() periodoFiscal: string;
  @ApiProperty() @IsString() proveedorNombre: string;
  @ApiProperty({ example: 'J-98765432-1' }) @IsString() proveedorRif: string;
  @ApiProperty() @IsString() numeroFacturaAfectada: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numeroControlFactura?: string;

  @ApiProperty() @IsNumber() totalFacturaBs: number;
  @ApiProperty() @IsNumber() baseImponibleBs: number;
  @ApiProperty() @IsNumber() ivaTotalBs: number;
  @ApiProperty({ description: 'Porcentaje de retención (ej: 75 o 100 para IVA, 1 a 5 para ISLR)' })
  @IsNumber()
  porcentajeRetenido: number;
}
