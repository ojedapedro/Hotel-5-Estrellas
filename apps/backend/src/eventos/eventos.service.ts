import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEventoDto,
  UpdateEventoDto,
  CreateSalonDto,
  EstadoEvento,
} from './dto/evento.dto';
import { generarCorrelativo } from '@hotel/shared-utils';

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── SALONES ─────────────────────────────────────────────────────────────────

  async createSalon(dto: CreateSalonDto) {
    return this.prisma.salon.create({ data: dto });
  }

  async findAllSalones() {
    return this.prisma.salon.findMany({
      include: {
        _count: { select: { eventos: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async checkDisponibilidadSalon(
    salonId: string,
    fechaInicio: Date,
    fechaFin: Date,
    excludeEventoId?: string,
  ) {
    const conflictos = await this.prisma.evento.findMany({
      where: {
        salonId,
        id: excludeEventoId ? { not: excludeEventoId } : undefined,
        estado: { notIn: [EstadoEvento.CANCELADO] },
        OR: [
          { fechaInicio: { lte: fechaFin }, fechaFin: { gte: fechaInicio } },
        ],
      },
    });
    return conflictos.length === 0;
  }

  // ─── EVENTOS ─────────────────────────────────────────────────────────────────

  async createEvento(dto: CreateEventoDto, usuarioId: string) {
    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = new Date(dto.fechaFin);

    if (fechaFin <= fechaInicio)
      throw new BadRequestException('La fecha fin debe ser posterior a la fecha inicio');

    const salon = await this.prisma.salon.findUnique({ where: { id: dto.salonId } });
    if (!salon) throw new NotFoundException('Salón no encontrado');

    if (dto.numeroPersonas > salon.capacidadMaxima)
      throw new BadRequestException(
        `El salón ${salon.nombre} tiene capacidad máxima de ${salon.capacidadMaxima} personas`,
      );

    const disponible = await this.checkDisponibilidadSalon(dto.salonId, fechaInicio, fechaFin);
    if (!disponible)
      throw new BadRequestException('El salón no está disponible en las fechas seleccionadas');

    // Calculate pricing
    const tasa = await this.prisma.tasaBcv.findFirst({ orderBy: { fecha: 'desc' } });
    const precioPersona = Number(dto.precioPersonaUsd ?? salon.precioHoraUsd ?? 50);
    const subtotalUsd = precioPersona * dto.numeroPersonas;
    const ivaUsd = subtotalUsd * 0.16;
    const totalUsd = subtotalUsd + ivaUsd;
    const totalBs = totalUsd * Number(tasa?.tasaUsd ?? 36.5);

    const correlativo = await this.generateCorrelativo();

    return this.prisma.evento.create({
      data: {
        correlativo,
        nombreEvento: dto.nombreEvento,
        tipoEvento: dto.tipoEvento,
        clienteNombre: dto.clienteNombre,
        clienteContacto: dto.clienteContacto,
        clienteRif: dto.clienteRif,
        fechaInicio,
        fechaFin,
        numeroPersonas: dto.numeroPersonas,
        salonId: dto.salonId,
        ejecutivoCuentasId: usuarioId,
        tasaBcvCongelada: tasa?.tasaUsd ?? 36.5,
        precioPersonaUsd: precioPersona,
        subtotalUsd,
        ivaUsd,
        totalUsd,
        totalBs,
        adelantoUsd: dto.adelantoUsd ?? 0,
        adelantoBs: (dto.adelantoUsd ?? 0) * Number(tasa?.tasaUsd ?? 36.5),
        serviciosAdicionales: dto.serviciosAdicionales ?? [],
        notas: dto.notas,
        estado: EstadoEvento.COTIZACION,
      },
      include: { salon: true, ejecutivoCuentas: { select: { nombre: true } } },
    });
  }

  async findAllEventos(estado?: EstadoEvento, fechaDesde?: string, fechaHasta?: string) {
    return this.prisma.evento.findMany({
      where: {
        ...(estado && { estado }),
        ...(fechaDesde && { fechaInicio: { gte: new Date(fechaDesde) } }),
        ...(fechaHasta && { fechaFin: { lte: new Date(fechaHasta) } }),
      },
      include: {
        salon: { select: { nombre: true, capacidadMaxima: true } },
        ejecutivoCuentas: { select: { nombre: true } },
      },
      orderBy: { fechaInicio: 'asc' },
    });
  }

  async findOneEvento(id: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id },
      include: {
        salon: true,
        ejecutivoCuentas: { select: { nombre: true, email: true } },
      },
    });
    if (!evento) throw new NotFoundException('Evento no encontrado');
    return evento;
  }

  async updateEvento(id: string, dto: UpdateEventoDto, usuarioId: string) {
    const evento = await this.prisma.evento.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException('Evento no encontrado');
    if (evento.estado === EstadoEvento.CANCELADO)
      throw new BadRequestException('No se puede modificar un evento cancelado');

    return this.prisma.evento.update({
      where: { id },
      data: {
        ...(dto.estado && { estado: dto.estado }),
        ...(dto.notas !== undefined && { notas: dto.notas }),
        ...(dto.numeroPersonas && { numeroPersonas: dto.numeroPersonas }),
        ...(dto.precioPersonaUsd && {
          precioPersonaUsd: dto.precioPersonaUsd,
          subtotalUsd: dto.precioPersonaUsd * evento.numeroPersonas,
          ivaUsd: dto.precioPersonaUsd * evento.numeroPersonas * 0.16,
          totalUsd: dto.precioPersonaUsd * evento.numeroPersonas * 1.16,
          totalBs: dto.precioPersonaUsd * evento.numeroPersonas * 1.16 * Number(evento.tasaBcvCongelada),
        }),
      },
    });
  }

  async confirmarEvento(id: string, usuarioId: string) {
    const evento = await this.prisma.evento.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException('Evento no encontrado');
    if (evento.estado !== EstadoEvento.COTIZACION)
      throw new BadRequestException('Solo se pueden confirmar cotizaciones');

    return this.prisma.evento.update({
      where: { id },
      data: { estado: EstadoEvento.CONFIRMADO, confirmadoPorId: usuarioId, confirmadoEn: new Date() },
    });
  }

  async cancelarEvento(id: string, motivo: string) {
    const evento = await this.prisma.evento.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException('Evento no encontrado');
    if (evento.estado === EstadoEvento.FINALIZADO)
      throw new BadRequestException('No se puede cancelar un evento finalizado');

    return this.prisma.evento.update({
      where: { id },
      data: { estado: EstadoEvento.CANCELADO, motivoCancelacion: motivo },
    });
  }

  async getCalendario(fechaDesde: string, fechaHasta: string) {
    return this.prisma.evento.findMany({
      where: {
        estado: { notIn: [EstadoEvento.CANCELADO] },
        fechaInicio: { lte: new Date(fechaHasta) },
        fechaFin: { gte: new Date(fechaDesde) },
      },
      include: { salon: { select: { nombre: true } } },
      orderBy: { fechaInicio: 'asc' },
    });
  }

  async getKPIs() {
    const now = new Date();
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesFin = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalMes, confirmados, ingresos] = await Promise.all([
      this.prisma.evento.count({ where: { creadoEn: { gte: mesInicio, lte: mesFin } } }),
      this.prisma.evento.count({ where: { estado: EstadoEvento.CONFIRMADO } }),
      this.prisma.evento.aggregate({
        where: { estado: { notIn: [EstadoEvento.CANCELADO, EstadoEvento.COTIZACION] }, creadoEn: { gte: mesInicio } },
        _sum: { totalUsd: true, totalBs: true },
      }),
    ]);

    return {
      eventosMes: totalMes,
      eventosConfirmados: confirmados,
      ingresosMesUsd: ingresos._sum.totalUsd ?? 0,
      ingresosMesBs: ingresos._sum.totalBs ?? 0,
    };
  }

  private async generateCorrelativo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.evento.count({
      where: { creadoEn: { gte: new Date(`${year}-01-01`) } },
    });
    return generarCorrelativo('EVT', count + 1, year);
  }
}
