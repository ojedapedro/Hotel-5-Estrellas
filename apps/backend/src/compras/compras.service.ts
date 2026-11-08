import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrdenCompraDto,
  AprobarOrdenDto,
  RecibirOrdenDto,
  CreateProveedorDto,
  EstadoOrdenCompra,
} from './dto/compra.dto';
import { generarCorrelativo } from '@hotel/shared-utils';

@Injectable()
export class ComprasService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── PROVEEDORES ────────────────────────────────────────────────────────────

  async createProveedor(dto: CreateProveedorDto, usuarioId: string) {
    const existing = await this.prisma.proveedor.findUnique({ where: { rif: dto.rif } });
    if (existing) throw new BadRequestException(`Proveedor con RIF ${dto.rif} ya existe`);

    return this.prisma.proveedor.create({
      data: { ...dto, creadoPorId: usuarioId },
    });
  }

  async findAllProveedores(activo?: boolean) {
    return this.prisma.proveedor.findMany({
      where: activo !== undefined ? { activo } : {},
      orderBy: { nombre: 'asc' },
    });
  }

  async findOneProveedor(id: string) {
    const p = await this.prisma.proveedor.findUnique({
      where: { id },
      include: { ordenesCompra: { take: 10, orderBy: { creadoEn: 'desc' } } },
    });
    if (!p) throw new NotFoundException('Proveedor no encontrado');
    return p;
  }

  // ─── CATÁLOGO DE ARTÍCULOS ───────────────────────────────────────────────────

  async getArticulos(categoriaId?: string, search?: string) {
    return this.prisma.articulo.findMany({
      where: {
        ...(categoriaId && { categoriaId }),
        ...(search && { nombre: { contains: search, mode: 'insensitive' } }),
        activo: true,
      },
      include: {
        existencias: { include: { almacen: { select: { nombre: true } } } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // ─── ÓRDENES DE COMPRA ───────────────────────────────────────────────────────

  async createOrden(dto: CreateOrdenCompraDto, usuarioId: string) {
    // Get BCV rate with fallback
    const tasa = await this.prisma.tasaBcv.findFirst({ orderBy: { fecha: 'desc' } });
    const tasaValor = tasa ? Number(tasa.tasaUsd) : 36.50;

    const correlativo = await this.generateCorrelativo();

    // Calculate totals
    let subtotalUsd = 0;
    for (const item of dto.items) {
      subtotalUsd += item.cantidad * item.precioUnitarioUsd;
    }
    const ivaUsd = subtotalUsd * 0.16;
    const totalUsd = subtotalUsd + ivaUsd;
    const totalBs = totalUsd * tasaValor;

    const orden = await this.prisma.ordenCompra.create({
      data: {
        correlativo,
        proveedorId: dto.proveedorId,
        almacenDestinoId: dto.almacenDestinoId,
        creadoPorId: usuarioId,
        tasaBcvCongelada: tasaValor,
        fechaEntregaEsperada: dto.fechaEntregaEsperada ? new Date(dto.fechaEntregaEsperada) : null,
        notas: dto.notas,
        subtotalUsd,
        ivaUsd,
        totalUsd,
        totalBs,
        estado: EstadoOrdenCompra.BORRADOR,
        items: {
          create: dto.items.map((item) => ({
            articuloId: item.articuloId,
            cantidad: item.cantidad,
            cantidadRecibida: 0,
            precioUnitarioUsd: item.precioUnitarioUsd,
            subtotalUsd: item.cantidad * item.precioUnitarioUsd,
            notas: item.notas,
          })),
        },
      },
      include: { items: { include: { articulo: true } }, proveedor: true },
    });

    return orden;
  }

  async findAllOrdenes(estado?: EstadoOrdenCompra, proveedorId?: string) {
    return this.prisma.ordenCompra.findMany({
      where: {
        ...(estado && { estado }),
        ...(proveedorId && { proveedorId }),
      },
      include: {
        proveedor: { select: { nombre: true, rif: true } },
        almacenDestino: { select: { nombre: true } },
        creadoPor: { select: { nombre: true } },
        _count: { select: { items: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async findOneOrden(id: string) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { id },
      include: {
        proveedor: true,
        almacenDestino: true,
        creadoPor: { select: { nombre: true, rol: true } },
        aprobadoPor: { select: { nombre: true } },
        items: { include: { articulo: { select: { nombre: true, unidadMedida: true, codigoBarra: true } } } },
      },
    });
    if (!orden) throw new NotFoundException('Orden de compra no encontrada');
    return orden;
  }

  async aprobarOrden(id: string, dto: AprobarOrdenDto, usuarioId: string) {
    const orden = await this.prisma.ordenCompra.findUnique({ where: { id } });
    if (!orden) throw new NotFoundException('Orden no encontrada');
    if (orden.estado !== EstadoOrdenCompra.BORRADOR)
      throw new BadRequestException('Solo se pueden aprobar órdenes en estado BORRADOR');

    return this.prisma.ordenCompra.update({
      where: { id },
      data: {
        estado: EstadoOrdenCompra.APROBADA,
        aprobadoPorId: usuarioId,
        aprobadoEn: new Date(),
        comentarioAprobacion: dto.comentario,
      },
    });
  }

  async recibirOrden(id: string, dto: RecibirOrdenDto, usuarioId: string) {
    const orden = await this.findOneOrden(id);
    if (![EstadoOrdenCompra.APROBADA, EstadoOrdenCompra.ENVIADA, EstadoOrdenCompra.RECIBIDA_PARCIAL].includes(orden.estado as any))
      throw new BadRequestException('La orden no está en un estado válido para recepción');

    const tasa = await this.prisma.tasaBcv.findFirst({ orderBy: { fecha: 'desc' } });

    return this.prisma.$transaction(async (tx) => {
      // Update items & generate inventory movements
      for (const recibido of dto.items) {
        const item = orden.items.find((i: any) => i.id === recibido.itemId);
        if (!item) continue;

        await tx.itemOrdenCompra.update({
          where: { id: recibido.itemId },
          data: { cantidadRecibida: { increment: recibido.cantidadRecibida } },
        });

        // Register inventory entry movement
        const existencia = await tx.existenciaAlmacen.findFirst({
          where: { articuloId: item.articuloId, almacenId: orden.almacenDestinoId },
        });

        const costoUnitarioUsd = (item as any).precioUnitarioUsd;
        const costoUnitarioBs = costoUnitarioUsd * Number(tasa?.tasaUsd ?? orden.tasaBcvCongelada);

        if (existencia) {
          // Weighted average cost
          const totalQty = Number(existencia.cantidad) + recibido.cantidadRecibida;
          const newCosto =
            (Number(existencia.cantidad) * Number(existencia.costoPromedioUsd) +
              recibido.cantidadRecibida * costoUnitarioUsd) /
            totalQty;
          await tx.existenciaAlmacen.update({
            where: { id: existencia.id },
            data: { cantidad: totalQty, costoPromedioUsd: newCosto },
          });
        } else {
          await tx.existenciaAlmacen.create({
            data: {
              articuloId: item.articuloId,
              almacenId: orden.almacenDestinoId,
              cantidad: recibido.cantidadRecibida,
              costoPromedioUsd: costoUnitarioUsd,
            },
          });
        }

        await tx.movimientoInventario.create({
          data: {
            tipo: 'ENTRADA',
            articuloId: item.articuloId,
            almacenId: orden.almacenDestinoId,
            cantidad: recibido.cantidadRecibida,
            costoUnitarioUsd,
            costoUnitarioBs,
            tasaBcvCongelada: tasa?.tasaUsd ?? orden.tasaBcvCongelada,
            referencia: `OC-${orden.correlativo}`,
            lote: recibido.lote,
            vencimiento: recibido.vencimiento ? new Date(recibido.vencimiento) : null,
            registradoPorId: usuarioId,
          },
        });
      }

      // Check if fully received
      const updatedItems = await tx.itemOrdenCompra.findMany({ where: { ordenCompraId: id } });
      const totalCantidad = updatedItems.reduce((sum: number, i: any) => sum + i.cantidad, 0);
      const totalRecibido = updatedItems.reduce((sum: number, i: any) => sum + i.cantidadRecibida, 0);
      const nuevoEstado =
        totalRecibido >= totalCantidad
          ? EstadoOrdenCompra.RECIBIDA_TOTAL
          : EstadoOrdenCompra.RECIBIDA_PARCIAL;

      return tx.ordenCompra.update({
        where: { id },
        data: {
          estado: nuevoEstado,
          notasRecepcion: dto.notasRecepcion,
          fechaRecepcion: nuevoEstado === EstadoOrdenCompra.RECIBIDA_TOTAL ? new Date() : undefined,
        },
      });
    });
  }

  async cancelarOrden(id: string, motivo: string, usuarioId: string) {
    const orden = await this.prisma.ordenCompra.findUnique({ where: { id } });
    if (!orden) throw new NotFoundException('Orden no encontrada');
    if ([EstadoOrdenCompra.RECIBIDA_TOTAL, EstadoOrdenCompra.CANCELADA].includes(orden.estado as any))
      throw new BadRequestException('No se puede cancelar esta orden');

    return this.prisma.ordenCompra.update({
      where: { id },
      data: { estado: EstadoOrdenCompra.CANCELADA, motivoCancelacion: motivo },
    });
  }

  private async generateCorrelativo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.ordenCompra.count({
      where: { creadoEn: { gte: new Date(`${year}-01-01`) } },
    });
    return generarCorrelativo('OC', count + 1, year);
  }
}
