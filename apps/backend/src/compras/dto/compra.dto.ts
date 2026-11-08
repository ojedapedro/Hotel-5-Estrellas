import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EstadoOrdenCompra {
  BORRADOR = 'BORRADOR',
  APROBADA = 'APROBADA',
  ENVIADA = 'ENVIADA',
  RECIBIDA_PARCIAL = 'RECIBIDA_PARCIAL',
  RECIBIDA_TOTAL = 'RECIBIDA_TOTAL',
  CANCELADA = 'CANCELADA',
}

export class ItemOrdenDto {
  @ApiProperty() @IsString() articuloId: string;
  @ApiProperty() @IsNumber() @Min(1) cantidad: number;
  @ApiProperty() @IsNumber() @Min(0) precioUnitarioUsd: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
}

export class CreateOrdenCompraDto {
  @ApiProperty() @IsString() proveedorId: string;
  @ApiProperty() @IsString() almacenDestinoId: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fechaEntregaEsperada?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
  @ApiProperty({ type: [ItemOrdenDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemOrdenDto)
  items: ItemOrdenDto[];
}

export class AprobarOrdenDto {
  @ApiPropertyOptional() @IsOptional() @IsString() comentario?: string;
}

export class RecibirOrdenDto {
  @ApiProperty({ type: [Object] })
  @IsArray()
  items: { itemId: string; cantidadRecibida: number; lote?: string; vencimiento?: string }[];
  @ApiPropertyOptional() @IsOptional() @IsString() notasRecepcion?: string;
}

export class CreateProveedorDto {
  @ApiProperty() @IsString() nombre: string;
  @ApiProperty() @IsString() rif: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contacto?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefono?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() direccion?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() creditoDiasDefault?: number;
}
