import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, creatorId?: string) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con este correo electrónico');
    }

    // Resolver hotelId por defecto si no viene
    let hotelId = dto.hotelId;
    if (!hotelId) {
      const hotel = await this.prisma.hotel.findFirst();
      hotelId = hotel?.id;
    }

    if (!hotelId) {
      throw new ConflictException('No se ha configurado ningún hotel en el sistema');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        passwordHash,
        nombre: dto.nombre,
        apellido: dto.apellido,
        cedula: dto.cedula,
        telefono: dto.telefono,
        rol: dto.rol,
        hotelId,
        createdBy: creatorId,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        cedula: true,
        telefono: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20, search } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          cedula: true,
          telefono: true,
          rol: true,
          activo: true,
          twoFactorEnabled: true,
          ultimoAcceso: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        cedula: true,
        telefono: true,
        rol: true,
        activo: true,
        twoFactorEnabled: true,
        ultimoAcceso: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const updateData: any = { ...dto };
    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(dto.password, salt);
      delete updateData.password;
    }

    return this.prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        updatedAt: true,
      },
    });
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: !user.activo },
      select: { id: true, email: true, activo: true },
    });
  }
}
