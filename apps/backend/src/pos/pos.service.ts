import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BcvService } from '../bcv/bcv.service';
import { HotelGateway } from '../websockets/hotel.gateway';
import { CreateComandaDto, PayComandaDto } from './dto/comanda.dto';
import { EstadoComanda, MetodoPago, Moneda, TipoCargoFolio } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private bcvService: BcvService,
    private hotelGateway: HotelGateway,
  ) {}

  /**
   * Obtiene todos los puntos de venta y sus mesas
   */
  async getPuntosVenta() {
    return this.prisma.puntoVenta.findMany({
      where: { activo: true },
      include: {
        mesas: {
          where: { activa: true },
          orderBy: { numero: 'asc' },
        },
      },
    });
  }

  /**
   * Obtiene el menú categorizado
   */
  async getMenu() {
    return this.prisma.categoriaMenu.findMany({
      where: { activa: true },
      include: {
        productos: {
          where: { disponible: true },
          orderBy: { nombre: 'asc' },
        },
      },
      orderBy: { orden: 'asc' },
    });
  }

  /**
   * Crea una nueva comanda
   */
  async createComanda(dto: CreateComandaDto, meseroId?: string) {
    const { tasaUsd } = await this.bcvService.getCurrentRate();

    // Obtener los productos para calcular totales
    const productIds = dto.items.map((i) => i.productoId);
    const productos = await this.prisma.productoMenu.findMany({
      where: { id: { in: productIds } },
    });

    const prodMap = new Map(productos.map((p) => [p.id, p]));

    let subtotalUsd = 0;
    const itemsData: any[] = [];

    for (const item of dto.items) {
      const prod = prodMap.get(item.productoId);
      if (!prod) throw new NotFoundException(`Producto ${item.productoId} no encontrado`);

      const price = Number(prod.precioUsd);
      const subtotal = price * item.cantidad;
      subtotalUsd += subtotal;

      itemsData.push({
        productoId: item.productoId,
        cantidad: new Decimal(item.cantidad),
        precioUnitUsd: new Decimal(price),
        subtotalUsd: new Decimal(subtotal),
        modificadores: item.modificadores || [],
        notas: item.notas,
        estado: 'PENDIENTE',
      });
    }

    const ivaUsd = (subtotalUsd * 16) / 100;
    const totalUsd = subtotalUsd + ivaUsd;
    const totalBs = totalUsd * tasaUsd;

    const count = await this.prisma.comanda.count();
    const year = new Date().getFullYear();
    const codigoComanda = `CMD-${year}-${String(count + 1).padStart(5, '0')}`;

    const comanda = await this.prisma.comanda.create({
      data: {
        codigoComanda,
        puntoVentaId: dto.puntoVentaId,
        mesaId: dto.mesaId,
        folioId: dto.folioId,
        meseroId,
        estado: EstadoComanda.ABIERTA,
        subtotalUsd: new Decimal(subtotalUsd),
        ivaUsd: new Decimal(ivaUsd),
        totalUsd: new Decimal(totalUsd),
        subtotalBs: new Decimal(subtotalUsd * tasaUsd),
        totalBs: new Decimal(totalBs),
        tasaBcv: new Decimal(tasaUsd),
        notas: dto.notas,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: { include: { producto: true } },
        mesa: true,
      },
    });

    // Si tiene mesa asignada, cambiar estado a OCUPADA
    if (dto.mesaId) {
      await this.prisma.mesa.update({
        where: { id: dto.mesaId },
        data: { estado: 'OCUPADA' },
      });
    }

    return comanda;
  }

  /**
   * Envía la comanda a cocina y emite evento WebSocket en vivo
   */
  async sendToKitchen(comandaId: string) {
    const comanda = await this.prisma.comanda.update({
      where: { id: comandaId },
      data: { estado: EstadoComanda.ENVIADA_COCINA },
      include: {
        items: { include: { producto: true } },
        mesa: true,
        puntoVenta: true,
      },
    });

    // Actualizar estado de items
    await this.prisma.itemComanda.updateMany({
      where: { comandaId },
      data: { estado: 'ENVIADO' },
    });

    // Emitir WebSocket a pantalla de cocina
    this.hotelGateway.emitNewKitchenOrder(comanda);

    return comanda;
  }

  /**
   * Cobra la comanda (o hace cargo a folio de habitación)
   * Y descuenta los ingredientes de las recetas del almacén de Alimentos/Bebidas
   */
  async payComanda(comandaId: string, dto: PayComandaDto, cajeroId?: string) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { id: comandaId },
      include: {
        items: {
          include: {
            producto: {
              include: {
                receta: { include: { ingredientes: true } },
              },
            },
          },
        },
      },
    });

    if (!comanda) throw new NotFoundException('Comanda no encontrada');
    if (comanda.estado === EstadoComanda.CERRADA) {
      throw new BadRequestException('Esta comanda ya fue cobrada');
    }

    const { tasaUsd } = await this.bcvService.getCurrentRate();

    // 1. Si es cargo a habitación
    if (dto.metodoPago === MetodoPago.CARGO_HABITACION) {
      const folioId = dto.folioId || comanda.folioId;
      if (!folioId) {
        throw new BadRequestException('Se requiere especificar el folio de habitación para el cargo');
      }

      const folio = await this.prisma.folio.findUnique({ where: { id: folioId } });
      if (!folio || folio.estado !== 'ABIERTO') {
        throw new BadRequestException('El folio de habitación no está disponible o está cerrado');
      }

      const totalUsd = Number(comanda.totalUsd);
      const totalBs = totalUsd * tasaUsd;

      // Crear cargo en el folio del huésped
      await this.prisma.cargoFolio.create({
        data: {
          folioId,
          concepto: `Consumo Restaurante - ${comanda.codigoComanda}`,
          tipo: TipoCargoFolio.POS,
          baseImponibleUsd: comanda.subtotalUsd,
          ivaAlicuota: new Decimal(16),
          ivaUsd: comanda.ivaUsd,
          ivaBs: new Decimal(Number(comanda.ivaUsd) * tasaUsd),
          montoUsd: comanda.totalUsd,
          montoBs: new Decimal(totalBs),
          tasaBcv: new Decimal(tasaUsd),
          origenModulo: 'POS',
          origenId: comanda.id,
          creadoPor: cajeroId,
        },
      });

      // Actualizar saldo del folio
      await this.prisma.folio.update({
        where: { id: folioId },
        data: {
          saldoUsd: new Decimal(Number(folio.saldoUsd) + totalUsd),
          saldoBs: new Decimal(Number(folio.saldoBs) + totalBs),
        },
      });
    }

    // 2. Registrar el pago de la comanda
    const pagaEnDivisas = [
      MetodoPago.EFECTIVO_USD,
      MetodoPago.TARJETA_CREDITO_INT,
      MetodoPago.ZELLE,
      MetodoPago.BINANCE,
      MetodoPago.TRANSFERENCIA_USD,
    ].includes(dto.metodoPago as any);

    const igtfMonto = pagaEnDivisas ? (dto.monto * 3) / 100 : 0;
    const montoUsd = dto.moneda === Moneda.USD ? dto.monto : dto.monto / tasaUsd;
    const montoBs = dto.moneda === Moneda.VES ? dto.monto : dto.monto * tasaUsd;

    await this.prisma.pagoComanda.create({
      data: {
        comandaId: comanda.id,
        metodoPago: dto.metodoPago,
        referencia: dto.referencia,
        monedaOriginal: dto.moneda,
        montoOriginal: new Decimal(dto.monto),
        tasaBcvCongelada: new Decimal(tasaUsd),
        montoUsd: new Decimal(montoUsd),
        montoBs: new Decimal(montoBs),
        igtfPorcentaje: new Decimal(pagaEnDivisas ? 3 : 0),
        igtfMonto: new Decimal(igtfMonto),
      },
    });

    // 3. Cerrar comanda
    await this.prisma.comanda.update({
      where: { id: comandaId },
      data: {
        estado: EstadoComanda.CERRADA,
        cajeroId,
      },
    });

    // 4. Liberar mesa si estaba asociada
    if (comanda.mesaId) {
      await this.prisma.mesa.update({
        where: { id: comanda.mesaId },
        data: { estado: 'DISPONIBLE' },
      });
    }

    // 5. Descontar recetas de inventario (Regla de negocio: Inventario por receta)
    const almacenAlimentos = await this.prisma.almacen.findFirst({
      where: { nombre: { contains: 'Alimentos', mode: 'insensitive' } },
    });

    if (almacenAlimentos) {
      for (const item of comanda.items) {
        if (item.producto.receta?.ingredientes) {
          for (const ing of item.producto.receta.ingredientes) {
            const cantidadConsumida = Number(ing.cantidad) * Number(item.cantidad);

            // Descontar existencia
            await this.prisma.existenciaAlmacen.updateMany({
              where: {
                almacenId: almacenAlimentos.id,
                articuloId: ing.articuloId,
              },
              data: {
                cantidad: { decrement: cantidadConsumida },
              },
            });

            // Registrar movimiento de kardex
            await this.prisma.movimientoInventario.create({
              data: {
                almacenOrigenId: almacenAlimentos.id,
                articuloId: ing.articuloId,
                tipo: 'SALIDA_RECETA',
                cantidad: new Decimal(cantidadConsumida),
                costoUnitarioUsd: new Decimal(0),
                costoTotalUsd: new Decimal(0),
                referenciaDocumento: comanda.codigoComanda,
                moduloOrigen: 'POS',
                documentoId: comanda.id,
                notas: `Consumo automático por receta de ${item.producto.nombre}`,
                creadoPor: cajeroId,
              },
            });
          }
        }
      }
    }

    return { success: true, message: 'Comanda cobrada y cerrada exitosamente' };
  }
}
