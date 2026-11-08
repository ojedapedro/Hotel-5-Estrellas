import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HotelGateway } from '../../websockets/hotel.gateway';
import { EstadoHabitacion, Role } from '@prisma/client';
import { FilterRoomsDto } from '../dto/room.dto';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private hotelGateway: HotelGateway,
  ) {}

  /**
   * Obtiene el mapa visual completo de las 200 habitaciones del hotel
   */
  async getHotelMap() {
    const rooms = await this.prisma.habitacion.findMany({
      where: { activa: true },
      include: {
        tipo: true,
        estancias: {
          where: { estado: 'ACTIVA' },
          include: {
            huesped: true,
            folios: {
              where: { estado: 'ABIERTO' },
              select: { id: true, codigoFolio: true, saldoUsd: true, saldoBs: true },
            },
          },
          take: 1,
        },
      },
      orderBy: [{ piso: 'asc' }, { numero: 'asc' }],
    });

    // Calcular estadísticas en tiempo real
    const counts = {
      total: rooms.length,
      disponibles: 0,
      ocupadas: 0,
      limpieza: 0,
      mantenimiento: 0,
      bloqueadas: 0,
      fueraServicio: 0,
    };

    rooms.forEach((r) => {
      switch (r.estado) {
        case EstadoHabitacion.DISPONIBLE: counts.disponibles++; break;
        case EstadoHabitacion.OCUPADA: counts.ocupadas++; break;
        case EstadoHabitacion.LIMPIEZA: counts.limpieza++; break;
        case EstadoHabitacion.MANTENIMIENTO: counts.mantenimiento++; break;
        case EstadoHabitacion.BLOQUEADA: counts.bloqueadas++; break;
        case EstadoHabitacion.FUERA_SERVICIO: counts.fueraServicio++; break;
      }
    });

    const ocupacionPorcentaje = counts.total > 0
      ? Math.round((counts.ocupadas / counts.total) * 100)
      : 0;

    return {
      rooms,
      stats: {
        ...counts,
        ocupacionPorcentaje,
      },
    };
  }

  async findAll(filter: FilterRoomsDto) {
    const where: any = { activa: true };
    if (filter.estado) where.estado = filter.estado;
    if (filter.piso) where.piso = Number(filter.piso);
    if (filter.tipo) where.tipo = { tipo: filter.tipo };

    return this.prisma.habitacion.findMany({
      where,
      include: {
        tipo: {
          include: {
            tarifas: { where: { activa: true } },
          },
        },
      },
      orderBy: [{ piso: 'asc' }, { numero: 'asc' }],
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.habitacion.findUnique({
      where: { id },
      include: {
        tipo: {
          include: { tarifas: { where: { activa: true } } },
        },
        estancias: {
          where: { estado: 'ACTIVA' },
          include: { huesped: true, folios: true },
        },
      },
    });

    if (!room) throw new NotFoundException('Habitación no encontrada');
    return room;
  }

  async updateStatus(id: string, nuevoEstado: EstadoHabitacion, userId?: string) {
    const room = await this.prisma.habitacion.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Habitación no encontrada');

    const updated = await this.prisma.habitacion.update({
      where: { id },
      data: { estado: nuevoEstado },
    });

    // Notificar en tiempo real a recepción, housekeeping y gerencia
    this.hotelGateway.emitRoomStatusChange(id, room.numero, nuevoEstado);

    return updated;
  }
}
