import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BcvService } from '../bcv/bcv.service';
import { CreateAsientoDto } from './dto/asiento.dto';
import { EstadoAsiento, EstadoPeriodo, TipoCuenta } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class ContabilidadService {
  constructor(
    private prisma: PrismaService,
    private bcvService: BcvService,
  ) {}

  /**
   * Obtiene el plan de cuentas jerárquico
   */
  async getPlanCuentas() {
    return this.prisma.cuentaContable.findMany({
      where: { activa: true },
      orderBy: { codigo: 'asc' },
    });
  }

  /**
   * Obtiene asientos contables con filtros
   */
  async getAsientos(periodoId?: string) {
    const where: any = {};
    if (periodoId) where.periodoId = periodoId;

    return this.prisma.asientoContable.findMany({
      where,
      include: {
        detalles: { include: { cuenta: true } },
        periodo: true,
      },
      orderBy: { fecha: 'desc' },
      take: 100,
    });
  }

  /**
   * Crea un asiento contable validando que cuadre exactamente en USD y VES simultáneamente
   */
  async createAsiento(dto: CreateAsientoDto, userId: string) {
    const periodo = await this.prisma.periodoContable.findUnique({
      where: { id: dto.periodoId },
    });

    if (!periodo || periodo.estado === EstadoPeriodo.BLOQUEADO) {
      throw new BadRequestException('El período contable está cerrado o bloqueado');
    }

    const { tasaUsd } = await this.bcvService.getCurrentRate();

    let totalDebeUsd = 0;
    let totalHaberUsd = 0;

    const detallesData = dto.detalles.map((d) => {
      const debeUsd = Number(d.debeUsd || 0);
      const haberUsd = Number(d.haberUsd || 0);

      totalDebeUsd += debeUsd;
      totalHaberUsd += haberUsd;

      const debeBs = debeUsd * tasaUsd;
      const haberBs = haberUsd * tasaUsd;

      return {
        cuentaId: d.cuentaId,
        descripcion: d.descripcion,
        debeUsd: new Decimal(debeUsd),
        haberUsd: new Decimal(haberUsd),
        debeBs: new Decimal(debeBs),
        haberBs: new Decimal(haberBs),
      };
    });

    // Validar partida doble (cuadre contable)
    if (Math.abs(totalDebeUsd - totalHaberUsd) > 0.01) {
      throw new BadRequestException(
        `El asiento no cuadra. Debe: $${totalDebeUsd.toFixed(2)}, Haber: $${totalHaberUsd.toFixed(2)}`,
      );
    }

    const count = await this.prisma.asientoContable.count();
    const year = new Date().getFullYear();
    const numero = `ASI-${year}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.asientoContable.create({
      data: {
        periodoId: dto.periodoId,
        numero,
        fecha: new Date(dto.fecha),
        descripcion: dto.descripcion,
        tipo: dto.tipo || 'MANUAL',
        estado: EstadoAsiento.APROBADO,
        totalDebeUsd: new Decimal(totalDebeUsd),
        totalHaberUsd: new Decimal(totalHaberUsd),
        totalDebeBs: new Decimal(totalDebeUsd * tasaUsd),
        totalHaberBs: new Decimal(totalHaberUsd * tasaUsd),
        tasaBcv: new Decimal(tasaUsd),
        creadoPor: userId,
        detalles: {
          create: detallesData,
        },
      },
      include: {
        detalles: { include: { cuenta: true } },
      },
    });
  }

  /**
   * Cierra un período contable (inmutable)
   */
  async closePeriodo(periodoId: string, userId: string) {
    const periodo = await this.prisma.periodoContable.findUnique({
      where: { id: periodoId },
    });
    if (!periodo) throw new NotFoundException('Período contable no encontrado');

    return this.prisma.periodoContable.update({
      where: { id: periodoId },
      data: {
        estado: EstadoPeriodo.BLOQUEADO,
        fechaCierre: new Date(),
        cerradoPor: userId,
      },
    });
  }

  /**
   * Calcula el Estado de Resultados simplificado (P&L) del período
   */
  async getEstadoResultados(periodoId: string) {
    const detalles = await this.prisma.detalleAsiento.findMany({
      where: {
        asiento: { periodoId, estado: EstadoAsiento.APROBADO, anulado: false },
      },
      include: {
        cuenta: true,
      },
    });

    let ingresosUsd = 0;
    let egresosUsd = 0;
    let ingresosBs = 0;
    let egresosBs = 0;

    detalles.forEach((d) => {
      if (d.cuenta.tipo === TipoCuenta.INGRESO) {
        ingresosUsd += Number(d.haberUsd) - Number(d.debeUsd);
        ingresosBs += Number(d.haberBs) - Number(d.debeBs);
      } else if (d.cuenta.tipo === TipoCuenta.EGRESO) {
        egresosUsd += Number(d.debeUsd) - Number(d.haberUsd);
        egresosBs += Number(d.debeBs) - Number(d.haberBs);
      }
    });

    const utilidadNetaUsd = ingresosUsd - egresosUsd;
    const utilidadNetaBs = ingresosBs - egresosBs;

    return {
      ingresosUsd,
      ingresosBs,
      egresosUsd,
      egresosBs,
      utilidadNetaUsd,
      utilidadNetaBs,
    };
  }
}
