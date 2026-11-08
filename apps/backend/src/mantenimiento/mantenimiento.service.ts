import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HotelGateway } from '../websockets/hotel.gateway';
import {
  CreateOrdenTrabajoDto,
  ActualizarOrdenTrabajoDto,
  ActualizarHousekeepingDto,
  EstadoOrdenTrabajo,
  PrioridadOrden,
  TipoOrdenTrabajo,
  EstadoHousekeeping,
} from './dto/mantenimiento.dto';
import { generarCorrelativo } from '@hotel/shared-utils';

@Injectable()
export class MantenimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: HotelGateway,
  ) {}

  // ─── ÓRDENES DE TRABAJO ──────────────────────────────────────────────────────

  async createOrden(dto: CreateOrdenTrabajoDto, solicitanteId: string) {
    const correlativo = await this.generateCorrelativo();

    const orden = await this.prisma.ordenTrabajo.create({
      data: {
        correlativo,
        tipo: dto.tipo,
        prioridad: dto.prioridad,
        descripcion: dto.descripcion,
        habitacionId: dto.habitacionId,
        areaComun: dto.areaComun,
        asignadoAId: dto.asignadoAId,
        solicitanteId,
        fechaProgramada: dto.fechaProgramada ? new Date(dto.fechaProgramada) : null,
        repuestosNecesarios: dto.repuestosNecesarios ?? [],
        estado: EstadoOrdenTrabajo.PENDIENTE,
      },
      include: {
        habitacion: { select: { numero: true, piso: true } },
        asignadoA: { select: { nombre: true } },
        solicitante: { select: { nombre: true } },
      },
    });

    // Notify via WebSocket if urgent
    if (dto.prioridad === PrioridadOrden.URGENTE) {
      this.gateway.server.emit('maintenance_urgent', {
        ordenId: orden.id,
        correlativo: orden.correlativo,
        descripcion: orden.descripcion,
        habitacion: (orden.habitacion as any)?.numero,
        area: orden.areaComun,
      });
    }

    return orden;
  }

  async findAllOrdenes(
    estado?: EstadoOrdenTrabajo,
    tipo?: TipoOrdenTrabajo,
    prioridad?: PrioridadOrden,
    asignadoAId?: string,
  ) {
    return this.prisma.ordenTrabajo.findMany({
      where: {
        ...(estado && { estado }),
        ...(tipo && { tipo }),
        ...(prioridad && { prioridad }),
        ...(asignadoAId && { asignadoAId }),
      },
      include: {
        habitacion: { select: { numero: true, piso: true, tipo: true } },
        asignadoA: { select: { nombre: true } },
        solicitante: { select: { nombre: true } },
      },
      orderBy: [
        { prioridad: 'desc' },
        { creadoEn: 'desc' },
      ],
    });
  }

  async findOneOrden(id: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        habitacion: true,
        asignadoA: { select: { nombre: true, rol: true } },
        solicitante: { select: { nombre: true } },
      },
    });
    if (!orden) throw new NotFoundException('Orden de trabajo no encontrada');
    return orden;
  }

  async actualizarOrden(id: string, dto: ActualizarOrdenTrabajoDto, usuarioId: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({ where: { id } });
    if (!orden) throw new NotFoundException('Orden de trabajo no encontrada');
    if (orden.estado === EstadoOrdenTrabajo.CANCELADA)
      throw new BadRequestException('No se puede modificar una orden cancelada');

    const data: any = {};
    if (dto.estado) data.estado = dto.estado;
    if (dto.asignadoAId) data.asignadoAId = dto.asignadoAId;
    if (dto.notasTecnico) data.notasTecnico = dto.notasTecnico;
    if (dto.repuestosUsados) data.repuestosUsados = dto.repuestosUsados;

    if (dto.estado === EstadoOrdenTrabajo.EN_PROGRESO) data.inicioEn = new Date();
    if (dto.estado === EstadoOrdenTrabajo.COMPLETADA) {
      data.completadaEn = new Date();
      data.resolucion = dto.resolucion;
      // If the order was for a room, update room status
      if (orden.habitacionId) {
        await this.prisma.habitacion.update({
          where: { id: orden.habitacionId },
          data: { estadoHousekeeping: 'LIMPIA' },
        });
      }
    }

    return this.prisma.ordenTrabajo.update({ where: { id }, data });
  }

  // ─── HOUSEKEEPING ────────────────────────────────────────────────────────────

  async getEstadoHousekeeping() {
    return this.prisma.habitacion.findMany({
      select: {
        id: true,
        numero: true,
        piso: true,
        tipo: true,
        estado: true,
        estadoHousekeeping: true,
      },
      orderBy: [{ piso: 'asc' }, { numero: 'asc' }],
    });
  }

  async actualizarHousekeeping(dto: ActualizarHousekeepingDto, usuarioId: string) {
    const habitacion = await this.prisma.habitacion.findUnique({ where: { id: dto.habitacionId } });
    if (!habitacion) throw new NotFoundException('Habitación no encontrada');

    const updated = await this.prisma.habitacion.update({
      where: { id: dto.habitacionId },
      data: { estadoHousekeeping: dto.estado },
    });

    // Notify front desk via WebSocket
    this.gateway.server.emit('housekeeping_update', {
      habitacionId: dto.habitacionId,
      numero: habitacion.numero,
      piso: habitacion.piso,
      nuevoEstado: dto.estado,
      actualizadoPor: usuarioId,
    });

    return updated;
  }

  async getPendienteHousekeeping() {
    return this.prisma.habitacion.findMany({
      where: {
        estadoHousekeeping: { in: ['SUCIA', 'EN_LIMPIEZA'] },
      },
      select: {
        id: true,
        numero: true,
        piso: true,
        tipo: true,
        estado: true,
        estadoHousekeeping: true,
      },
      orderBy: { piso: 'asc' },
    });
  }

  // ─── KPIs ────────────────────────────────────────────────────────────────────

  async getKPIs() {
    const [pendientes, enProgreso, completadasHoy, urgentes] = await Promise.all([
      this.prisma.ordenTrabajo.count({ where: { estado: EstadoOrdenTrabajo.PENDIENTE } }),
      this.prisma.ordenTrabajo.count({ where: { estado: EstadoOrdenTrabajo.EN_PROGRESO } }),
      this.prisma.ordenTrabajo.count({
        where: {
          estado: EstadoOrdenTrabajo.COMPLETADA,
          completadaEn: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.ordenTrabajo.count({
        where: { prioridad: PrioridadOrden.URGENTE, estado: { not: EstadoOrdenTrabajo.COMPLETADA } },
      }),
    ]);

    const habitacionesSucias = await this.prisma.habitacion.count({
      where: { estadoHousekeeping: 'SUCIA' },
    });

    return { pendientes, enProgreso, completadasHoy, urgentes, habitacionesSucias };
  }

  private async generateCorrelativo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.ordenTrabajo.count({
      where: { creadoEn: { gte: new Date(`${year}-01-01`) } },
    });
    return generarCorrelativo('OT', count + 1, year);
  }
}
