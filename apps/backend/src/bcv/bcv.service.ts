import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class BcvService {
  private readonly logger = new Logger(BcvService.name);
  private cachedRate: number | null = null;
  private lastFetchDate: string | null = null;

  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene la tasa BCV oficial del día.
   * Si no hay registrada para hoy, consulta o toma la última conocida o valor de contingencia.
   */
  async getCurrentRate(): Promise<{ tasaUsd: number; fecha: Date; fuente: string }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar en BD
    const rateRecord = await this.prisma.tasaBcv.findFirst({
      orderBy: { fecha: 'desc' },
    });

    if (rateRecord) {
      this.cachedRate = Number(rateRecord.tasaUsd);
      return {
        tasaUsd: this.cachedRate,
        fecha: rateRecord.fecha,
        fuente: rateRecord.fuente,
      };
    }

    // Tasa por defecto inicial para Venezuela si la BD está vacía
    const fallbackRate = 36.50;
    this.cachedRate = fallbackRate;

    return {
      tasaUsd: fallbackRate,
      fecha: today,
      fuente: 'DEFAULT_FALLBACK',
    };
  }

  /**
   * Registra manualmente o sincroniza una nueva tasa BCV
   */
  async setRate(tasaUsd: number, fecha?: Date, hotelId?: string) {
    const targetDate = fecha || new Date();
    targetDate.setHours(0, 0, 0, 0);

    let hId = hotelId;
    if (!hId) {
      const hotel = await this.prisma.hotel.findFirst();
      hId = hotel?.id || 'default-hotel';
    }

    const record = await this.prisma.tasaBcv.upsert({
      where: {
        hotelId_fecha: {
          hotelId: hId,
          fecha: targetDate,
        },
      },
      update: {
        tasaUsd: new Decimal(tasaUsd),
      },
      create: {
        hotelId: hId,
        fecha: targetDate,
        tasaUsd: new Decimal(tasaUsd),
        fuente: 'MANUAL_OVERRIDE',
      },
    });

    this.cachedRate = tasaUsd;
    this.logger.log(`Tasa BCV actualizada a ${tasaUsd} Bs/USD para la fecha ${targetDate.toISOString().split('T')[0]}`);

    return record;
  }
}
