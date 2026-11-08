import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BcvService } from '../../bcv/bcv.service';
import { HotelGateway } from '../../websockets/hotel.gateway';
import {
  CreateReservationDto,
} from '../dto/reservation.dto';
import { EstadoHabitacion, EstadoReserva } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private bcvService: BcvService,
    private hotelGateway: HotelGateway,
  ) {}

  async create(dto: CreateReservationDto, creatorId: string) {
    const habitacion = await this.prisma.habitacion.findUnique({
      where: { id: dto.habitacionId },
    });
    if (!habitacion) throw new NotFoundException('Habitación no encontrada');

    // Verificar si huésped existe o crearlo
    let huespedId = dto.huespedId;
    if (!huespedId && dto.huesped) {
      const huesped = await this.prisma.huesped.upsert({
        where: {
          documentoTipo_documentoNum: {
            documentoTipo: dto.huesped.documentoTipo,
            documentoNum: dto.huesped.documentoNum,
          },
        },
        update: {
          nombre: dto.huesped.nombre,
          apellido: dto.huesped.apellido,
          email: dto.huesped.email,
          telefono: dto.huesped.telefono,
          nacionalidad: dto.huesped.nacionalidad,
        },
        create: {
          nombre: dto.huesped.nombre,
          apellido: dto.huesped.apellido,
          documentoTipo: dto.huesped.documentoTipo,
          documentoNum: dto.huesped.documentoNum,
          email: dto.huesped.email,
          telefono: dto.huesped.telefono,
          nacionalidad: dto.huesped.nacionalidad,
        },
      });
      huespedId = huesped.id;
    }

    if (!huespedId) {
      throw new BadRequestException('Se requiere identificar al huésped');
    }

    const llegada = new Date(dto.fechaLlegada);
    const salida = new Date(dto.fechaSalida);
    const diffTime = Math.abs(salida.getTime() - llegada.getTime());
    const noches = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Obtener tasa BCV
    const { tasaUsd } = await this.bcvService.getCurrentRate();

    // Correlativo de reserva
    const count = await this.prisma.reserva.count();
    const year = new Date().getFullYear();
    const codigoReserva = `RES-${year}-${String(count + 1).padStart(5, '0')}`;

    const montoAnticipo = dto.montoAnticipo || 0;
    const montoAnticipoVes = montoAnticipo * tasaUsd;

    // Resolver tarifa válida (con fallback seguro)
    let tarifaId = dto.tarifaId;
    if (!tarifaId || tarifaId === 'uuid-tarifa') {
      const tarifaActiva = await this.prisma.tarifa.findFirst({
        where: { tipoHabId: habitacion.tipoId, activa: true },
      });
      tarifaId = tarifaActiva?.id;
      if (!tarifaId) {
        const anyTarifa = await this.prisma.tarifa.findFirst();
        tarifaId = anyTarifa?.id;
      }
    }

    const reserva = await this.prisma.reserva.create({
      data: {
        codigoReserva,
        huespedId,
        habitacionId: dto.habitacionId,
        tarifaId,
        canal: dto.canal,
        fechaLlegada: llegada,
        fechaSalida: salida,
        noches,
        adultos: dto.adultos || 1,
        ninos: dto.ninos || 0,
        montoAnticipo: new Decimal(montoAnticipo),
        montoAnticipoUsd: new Decimal(montoAnticipo),
        montoAnticipoVes: new Decimal(montoAnticipoVes),
        tasaBcvAnticipo: new Decimal(tasaUsd),
        notas: dto.notas,
        creadoPor: creatorId,
      },
      include: {
        huesped: true,
        habitacion: true,
        tarifa: true,
      },
    });

    return reserva;
  }

  async findAll(query: any = {}) {
    const where: any = {};
    if (query.estado) where.estado = query.estado;
    if (query.fecha) {
      const target = new Date(query.fecha);
      where.fechaLlegada = { lte: target };
      where.fechaSalida = { gte: target };
    }

    return this.prisma.reserva.findMany({
      where,
      include: {
        huesped: true,
        habitacion: { include: { tipo: true } },
        tarifa: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      include: {
        huesped: true,
        habitacion: { include: { tipo: true } },
        tarifa: true,
        estancias: {
          include: {
            folios: {
              include: { cargos: true, pagos: true },
            },
          },
        },
      },
    });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');
    return reserva;
  }

  /**
   * Proceso de Check-in:
   * 1. Valida reserva
   * 2. Cambia habitación a OCUPADA
   * 3. Crea estancia y Folio oficial del huésped
   * 4. Notifica en tiempo real
   */
  async checkIn(reservaId: string, userId: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { habitacion: true, tarifa: true },
    });

    if (!reserva) throw new NotFoundException('Reserva no encontrada');
    if (reserva.estado === EstadoReserva.CHECKIN) {
      throw new BadRequestException('La reserva ya tiene check-in realizado');
    }

    const { tasaUsd } = await this.bcvService.getCurrentRate();

    // 1. Crear estancia
    const estancia = await this.prisma.estancia.create({
      data: {
        reservaId: reserva.id,
        habitacionId: reserva.habitacionId,
        huespedId: reserva.huespedId,
        fechaCheckin: new Date(),
        noches: reserva.noches,
        estado: 'ACTIVA',
      },
    });

    // 2. Crear Folio
    const foliosCount = await this.prisma.folio.count();
    const year = new Date().getFullYear();
    const codigoFolio = `FOL-${year}-${String(foliosCount + 1).padStart(5, '0')}`;

    const folio = await this.prisma.folio.create({
      data: {
        codigoFolio,
        estanciaId: estancia.id,
        estado: 'ABIERTO',
        saldoUsd: new Decimal(0),
        saldoBs: new Decimal(0),
      },
    });

    // 3. Si hubo anticipo, registrarlo como pago inicial en el folio
    if (Number(reserva.montoAnticipoUsd) > 0) {
      const anticipoUsd = Number(reserva.montoAnticipoUsd);
      const anticipoBs = anticipoUsd * tasaUsd;

      await this.prisma.pagoFolio.create({
        data: {
          folioId: folio.id,
          metodoPago: 'TRANSFERENCIA_USD',
          referencia: `ANTICIPO-${reserva.codigoReserva}`,
          montoOriginal: new Decimal(anticipoUsd),
          monedaOriginal: 'USD',
          tasaBcvCongelada: new Decimal(tasaUsd),
          montoUsd: new Decimal(anticipoUsd),
          montoBs: new Decimal(anticipoBs),
          creadoPor: userId,
        },
      });

      await this.prisma.folio.update({
        where: { id: folio.id },
        data: {
          saldoUsd: new Decimal(-anticipoUsd),
          saldoBs: new Decimal(-anticipoBs),
        },
      });
    }

    // 4. Actualizar estado de habitación a OCUPADA
    await this.prisma.habitacion.update({
      where: { id: reserva.habitacionId },
      data: { estado: EstadoHabitacion.OCUPADA },
    });

    // 5. Actualizar estado de la reserva
    await this.prisma.reserva.update({
      where: { id: reserva.id },
      data: { estado: EstadoReserva.CHECKIN },
    });

    // 6. Notificar en vivo
    this.hotelGateway.emitRoomStatusChange(
      reserva.habitacionId,
      reserva.habitacion.numero,
      EstadoHabitacion.OCUPADA,
    );

    return { estancia, folio };
  }

  /**
   * Check-out de la habitación
   */
  async checkOut(folioId: string, userId: string) {
    const folio = await this.prisma.folio.findUnique({
      where: { id: folioId },
      include: {
        estancia: { include: { habitacion: true, reserva: true } },
      },
    });

    if (!folio) throw new NotFoundException('Folio no encontrado');

    const saldo = Number(folio.saldoUsd);
    if (saldo > 0.05) {
      throw new BadRequestException(
        `No se puede realizar checkout. El folio tiene saldo pendiente de $${saldo.toFixed(2)} USD`,
      );
    }

    // 1. Cerrar folio
    await this.prisma.folio.update({
      where: { id: folio.id },
      data: { estado: 'CERRADO' },
    });

    // 2. Cerrar estancia
    await this.prisma.estancia.update({
      where: { id: folio.estanciaId },
      data: { estado: 'CERRADA', fechaCheckout: new Date() },
    });

    // 3. Actualizar reserva a CHECKOUT
    if (folio.estancia.reservaId) {
      await this.prisma.reserva.update({
        where: { id: folio.estancia.reservaId },
        data: { estado: EstadoReserva.CHECKOUT },
      });
    }

    // 4. Cambiar habitación a LIMPIEZA
    await this.prisma.habitacion.update({
      where: { id: folio.estancia.habitacionId },
      data: { estado: EstadoHabitacion.LIMPIEZA },
    });

    // 5. Notificar
    this.hotelGateway.emitRoomStatusChange(
      folio.estancia.habitacionId,
      folio.estancia.habitacion.numero,
      EstadoHabitacion.LIMPIEZA,
    );

    return { success: true, message: 'Check-out completado exitosamente. Habitación enviada a LIMPIEZA.' };
  }
}
