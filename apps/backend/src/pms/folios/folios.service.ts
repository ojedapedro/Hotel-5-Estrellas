import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BcvService } from '../../bcv/bcv.service';
import { AddFolioChargeDto, AddFolioPaymentDto } from '../dto/reservation.dto';
import { TipoCargoFolio, MetodoPago, Moneda } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class FoliosService {
  constructor(
    private prisma: PrismaService,
    private bcvService: BcvService,
  ) {}

  async getFolio(id: string) {
    const folio = await this.prisma.folio.findUnique({
      where: { id },
      include: {
        estancia: {
          include: {
            huesped: true,
            habitacion: { include: { tipo: true } },
          },
        },
        cargos: {
          where: { anulado: false },
          orderBy: { createdAt: 'desc' },
        },
        pagos: {
          where: { anulado: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!folio) throw new NotFoundException('Folio no encontrado');
    return folio;
  }

  /**
   * Agrega un cargo al folio con tasa BCV congelada
   */
  async addCharge(folioId: string, dto: AddFolioChargeDto, userId?: string) {
    const folio = await this.prisma.folio.findUnique({ where: { id: folioId } });
    if (!folio || folio.estado !== 'ABIERTO') {
      throw new BadRequestException('Folio no disponible o ya cerrado');
    }

    const { tasaUsd } = await this.bcvService.getCurrentRate();
    const montoUsd = Number(dto.montoUsd);
    const montoBs = montoUsd * tasaUsd;

    // IVA 16% general
    const ivaAlicuota = 16;
    const ivaUsd = (montoUsd * ivaAlicuota) / 100;
    const ivaBs = ivaUsd * tasaUsd;

    const totalCargoUsd = montoUsd + ivaUsd;
    const totalCargoBs = montoBs + ivaBs;

    const cargo = await this.prisma.cargoFolio.create({
      data: {
        folioId,
        concepto: dto.concepto,
        tipo: (dto.tipo as TipoCargoFolio) || TipoCargoFolio.MANUAL,
        baseImponibleUsd: new Decimal(montoUsd),
        ivaAlicuota: new Decimal(ivaAlicuota),
        ivaUsd: new Decimal(ivaUsd),
        ivaBs: new Decimal(ivaBs),
        montoUsd: new Decimal(totalCargoUsd),
        montoBs: new Decimal(totalCargoBs),
        tasaBcv: new Decimal(tasaUsd),
        creadoPor: userId,
      },
    });

    // Actualizar saldo del folio
    const nuevoSaldoUsd = Number(folio.saldoUsd) + totalCargoUsd;
    const nuevoSaldoBs = Number(folio.saldoBs) + totalCargoBs;

    await this.prisma.folio.update({
      where: { id: folioId },
      data: {
        saldoUsd: new Decimal(nuevoSaldoUsd),
        saldoBs: new Decimal(nuevoSaldoBs),
      },
    });

    return cargo;
  }

  /**
   * Registra un pago en el folio con cálculo de IGTF del 3% si es en divisas
   */
  async addPayment(folioId: string, dto: AddFolioPaymentDto, userId?: string) {
    const folio = await this.prisma.folio.findUnique({ where: { id: folioId } });
    if (!folio || folio.estado !== 'ABIERTO') {
      throw new BadRequestException('Folio no disponible o ya cerrado');
    }

    const { tasaUsd } = await this.bcvService.getCurrentRate();
    const montoOriginal = Number(dto.monto);

    // Determinar si aplica IGTF (3% sobre divisas en efectivo, Zelle, TC internacional, Binance)
    const pagaEnDivisas = [
      MetodoPago.EFECTIVO_USD,
      MetodoPago.TARJETA_CREDITO_INT,
      MetodoPago.ZELLE,
      MetodoPago.BINANCE,
      MetodoPago.TRANSFERENCIA_USD,
    ].includes(dto.metodoPago as any);

    const igtfPorcentaje = pagaEnDivisas ? 3 : 0;
    const igtfMonto = pagaEnDivisas ? (montoOriginal * igtfPorcentaje) / 100 : 0;

    let montoUsd = 0;
    let montoBs = 0;

    if (dto.moneda === Moneda.USD) {
      montoUsd = montoOriginal;
      montoBs = montoOriginal * tasaUsd;
    } else {
      montoBs = montoOriginal;
      montoUsd = montoOriginal / tasaUsd;
    }

    const pago = await this.prisma.pagoFolio.create({
      data: {
        folioId,
        metodoPago: dto.metodoPago,
        referencia: dto.referencia,
        monedaOriginal: dto.moneda,
        montoOriginal: new Decimal(montoOriginal),
        tasaBcvCongelada: new Decimal(tasaUsd),
        montoUsd: new Decimal(montoUsd),
        montoBs: new Decimal(montoBs),
        igtfPorcentaje: new Decimal(igtfPorcentaje),
        igtfMonto: new Decimal(igtfMonto),
        creadoPor: userId,
      },
    });

    // Descontar del saldo del folio
    const nuevoSaldoUsd = Number(folio.saldoUsd) - montoUsd;
    const nuevoSaldoBs = Number(folio.saldoBs) - montoBs;

    await this.prisma.folio.update({
      where: { id: folioId },
      data: {
        saldoUsd: new Decimal(nuevoSaldoUsd),
        saldoBs: new Decimal(nuevoSaldoBs),
      },
    });

    return pago;
  }
}
