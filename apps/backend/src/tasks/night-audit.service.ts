import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BcvService } from '../bcv/bcv.service';
import { EstadoHabitacion, TipoCargoFolio } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class NightAuditService {
  private readonly logger = new Logger(NightAuditService.name);

  constructor(
    private prisma: PrismaService,
    private bcvService: BcvService,
  ) {}

  /**
   * Cron Job de Auditoría Nocturna ejecutado a las 23:59
   */
  @Cron('59 23 * * *')
  async handleScheduledNightAudit() {
    this.logger.log('Iniciando proceso automático de Auditoría Nocturna (23:59)...');
    return this.runNightAudit('SISTEMA_CRON');
  }

  /**
   * Ejecución manual o programada de la auditoría nocturna
   */
  async runNightAudit(ejecutadoPor: string = 'SISTEMA') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { tasaUsd } = await this.bcvService.getCurrentRate();

    // 1. Obtener todas las habitaciones en estado OCUPADA
    const occupiedRooms = await this.prisma.habitacion.findMany({
      where: { estado: EstadoHabitacion.OCUPADA, activa: true },
      include: {
        tipo: {
          include: {
            tarifas: { where: { activa: true }, take: 1 },
          },
        },
        estancias: {
          where: { estado: 'ACTIVA' },
          include: {
            folios: { where: { estado: 'ABIERTO' }, take: 1 },
            reserva: { include: { tarifa: true } },
          },
          take: 1,
        },
      },
    });

    let cargosGenerados = 0;
    let totalCargosUsd = 0;
    const detallesHabitaciones: any[] = [];

    // 2. Aplicar cargo de noche de alojamiento a cada folio activo
    for (const room of occupiedRooms) {
      const estancia = room.estancias[0];
      const folio = estancia?.folios[0];

      if (!folio) continue;

      // Obtener tarifa vigente (de la reserva o rack del tipo)
      const tarifaUsd = estancia.reserva?.tarifa
        ? Number(estancia.reserva.tarifa.precioUsd)
        : room.tipo.tarifas[0]
        ? Number(room.tipo.tarifas[0].precioUsd)
        : 120.00;

      const ivaUsd = (tarifaUsd * 16) / 100;
      const totalCargoUsd = tarifaUsd + ivaUsd;
      const totalCargoBs = totalCargoUsd * tasaUsd;

      // Generar cargo en el folio
      await this.prisma.cargoFolio.create({
        data: {
          folioId: folio.id,
          concepto: `Alojamiento Hab. ${room.numero} - ${today.toISOString().split('T')[0]}`,
          tipo: TipoCargoFolio.HABITACION,
          baseImponibleUsd: new Decimal(tarifaUsd),
          ivaAlicuota: new Decimal(16),
          ivaUsd: new Decimal(ivaUsd),
          ivaBs: new Decimal(ivaUsd * tasaUsd),
          montoUsd: new Decimal(totalCargoUsd),
          montoBs: new Decimal(totalCargoBs),
          tasaBcv: new Decimal(tasaUsd),
          origenModulo: 'AUDITORIA_NOCTURNA',
          creadoPor: ejecutadoPor,
        },
      });

      // Actualizar saldo del folio
      await this.prisma.folio.update({
        where: { id: folio.id },
        data: {
          saldoUsd: new Decimal(Number(folio.saldoUsd) + totalCargoUsd),
          saldoBs: new Decimal(Number(folio.saldoBs) + totalCargoBs),
        },
      });

      cargosGenerados++;
      totalCargosUsd += totalCargoUsd;
      detallesHabitaciones.push({
        habitacion: room.numero,
        folio: folio.codigoFolio,
        montoUsd: totalCargoUsd,
      });
    }

    // 3. Registrar auditoría nocturna en BD
    const auditRecord = await this.prisma.auditoriaNocturna.create({
      data: {
        fechaOperacion: today,
        ejecutadoPor,
        habitacionesOcupadas: occupiedRooms.length,
        cargosGenerados,
        totalCargosUsd: new Decimal(totalCargosUsd),
        tasaBcvDia: new Decimal(tasaUsd),
        resumen: detallesHabitaciones,
        estado: 'COMPLETADA',
      },
    });

    this.logger.log(
      `Auditoría Nocturna completada: ${cargosGenerados} cargos generados ($${totalCargosUsd.toFixed(2)} USD)`,
    );

    return auditRecord;
  }

  async getHistory() {
    return this.prisma.auditoriaNocturna.findMany({
      orderBy: { fechaEjecucion: 'desc' },
      take: 30,
    });
  }
}
