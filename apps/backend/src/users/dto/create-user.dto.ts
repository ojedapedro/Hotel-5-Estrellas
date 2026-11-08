import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'juan.perez@hotel.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Password123*' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @ApiPropertyOptional({ example: 'V-18765432' })
  @IsOptional()
  @IsString()
  cedula?: string;

  @ApiPropertyOptional({ example: '+58 412 1234567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ enum: Role, example: Role.RECEPCIONISTA })
  @IsEnum(Role)
  @IsNotEmpty()
  rol!: Role;

  @ApiPropertyOptional({ example: 'uuid-hotel-1' })
  @IsOptional()
  @IsString()
  hotelId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apellido?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  rol?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
