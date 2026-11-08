import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HotelGateway } from '../websockets/hotel.gateway';
import { CreateMovementDto } from './dto/movement.dto';
import { TipoMovimientoInventario } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private hotelGateway: HotelGateway,
  ) {}

  /**
   * Obtiene los 5 almacenes del hotel
   */
  async getWarehouses() {
    return this.prisma.almacen.findMany({
      where: { activo: true },
      include: {
        _count: { select: { existencias: true } },
      },
    });
  }

  /**
   * Obtiene el inventario actual por almacén o global
   */
  async getStock(almacenId?: string) {
    const where: any = {};
    if (almacenId) where.almacenId = almacenId;

    return this.prisma.existenciaAlmacen.findMany({
      where,
      include: {
        articulo: true,
        almacen: true,
      },
      orderBy: { articulo: { nombre: 'asc' } },
    });
  }

  /**
   * Obtiene artículos en alerta de stock mínimo
   */
  async getLowStockAlerts() {
    const existencias = await this.prisma.existenciaAlmacen.findMany({
      include: { articulo: true, almacen: true },
    });

    return existencias.filter((e) => {
      const cantidad = Number(e.cantidad);
      const stockMin = Number(e.articulo.stockMinimo);
      return cantidad <= stockMin;
    });
  }

  /**
   * Registra un movimiento de inventario y actualiza costo promedio ponderado
   */
  async registerMovement(dto: CreateMovementDto, userId?: string) {
    const articulo = await this.prisma.articulo.findUnique({
      where: { id: dto.articuloId },
    });
    if (!articulo) throw new NotFoundException('Artículo no encontrado');

    const cantidad = Number(dto.cantidad);
    const costoUnit = Number(dto.costoUnitarioUsd || articulo.costoPromedioUsd);
    const costoTotal = cantidad * costoUnit;

    // Manejar almacén destino (Entradas)
    if (dto.almacenDestinoId) {
      const dest = await this.prisma.almacen.findUnique({ where: { id: dto.almacenDestinoId } });
      if (!dest) throw new NotFoundException('Almacén destino no encontrado');

      const existencia = await this.prisma.existenciaAlmacen.findUnique({
        where: {
          almacenId_articuloId: {
            almacenId: dto.almacenDestinoId,
            articuloId: dto.articuloId,
          },
        },
      });

      const cantActual = existencia ? Number(existencia.cantidad) : 0;
      const costoActual = existencia ? Number(existencia.costoPromedioUsd) : Number(articulo.costoPromedioUsd);

      // Costo promedio ponderado: (cantActual * costoActual + cantidad * costoUnit) / (cantActual + cantidad)
      const nuevaCantidad = cantActual + cantidad;
      const nuevoCostoPromedio = nuevaCantidad > 0
        ? (cantActual * costoActual + cantidad * costoUnit) / nuevaCantidad
        : costoUnit;

      await this.prisma.existenciaAlmacen.upsert({
        where: {
          almacenId_articuloId: {
            almacenId: dto.almacenDestinoId,
            articuloId: dto.articuloId,
          },
        },
        update: {
          cantidad: new Decimal(nuevaCantidad),
          costoPromedioUsd: new Decimal(nuevoCostoPromedio),
          ultimaActualizacion: new Date(),
        },
        create: {
          almacenId: dto.almacenDestinoId,
          articuloId: dto.articuloId,
          cantidad: new Decimal(nuevaCantidad),
          costoPromedioUsd: new Decimal(nuevoCostoPromedio),
        },
      });

      // Actualizar costo en artículo
      await this.prisma.articulo.update({
        where: { id: dto.articuloId },
        data: { costoPromedioUsd: new Decimal(nuevoCostoPromedio) },
      });
    }

    // Manejar almacén origen (Salidas)
    if (dto.almacenOrigenId) {
      const existencia = await this.prisma.existenciaAlmacen.findUnique({
        where: {
          almacenId_articuloId: {
            almacenId: dto.almacenOrigenId,
            articuloId: dto.articuloId,
          },
        },
      });

      if (!existencia || Number(existencia.cantidad) < cantidad) {
        throw new BadRequestException('Existencia insuficiente en el almacén de origen');
      }

      const nuevaCantidad = Number(existencia.cantidad) - cantidad;

      await this.prisma.existenciaAlmacen.update({
        where: {
          almacenId_articuloId: {
            almacenId: dto.almacenOrigenId,
            articuloId: dto.articuloId,
          },
        },
        data: {
          cantidad: new Decimal(nuevaCantidad),
          ultimaActualizacion: new Date(),
        },
      });

      // Si cayó por debajo del stock mínimo, emitir alerta
      if (nuevaCantidad <= Number(articulo.stockMinimo)) {
        this.hotelGateway.emitLowStockAlert({
          articulo,
          almacenId: dto.almacenOrigenId,
          cantidadRestante: nuevaCantidad,
        });
      }
    }

    // Registrar en tabla inmutable de movimientos (Kardex)
    return this.prisma.movimientoInventario.create({
      data: {
        articuloId: dto.articuloId,
        almacenOrigenId: dto.almacenOrigenId,
        almacenDestinoId: dto.almacenDestinoId,
        tipo: dto.tipo,
        cantidad: new Decimal(cantidad),
        costoUnitarioUsd: new Decimal(costoUnit),
        costoTotalUsd: new Decimal(costoTotal),
        referenciaDocumento: dto.referenciaDocumento,
        notas: dto.notas,
        creadoPor: userId,
      },
    });
  }

  /**
   * Obtiene el historial de Kardex de un artículo
   */
  async getKardex(articuloId: string) {
    return this.prisma.movimientoInventario.findMany({
      where: { articuloId },
      include: {
        almacenOrigen: true,
        almacenDestino: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
