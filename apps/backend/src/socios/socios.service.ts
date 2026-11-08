import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BcvService } from '../bcv/bcv.service';
import {
  CreateSocioDto,
  SimularDistribucionDto,
  RegistrarPagoSocioDto,
} from './dto/socios.dto';
import { generarCorrelativo } from '@hotel/shared-utils';
import { Decimal } from 'decimal.js';

@Injectable()
export class SociosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcvService: BcvService,
  ) {}

  // ─── DIRECTO DE SOCIOS ────────────────────────────────────────────────────────

  async getSocios() {
    const socios = await this.prisma.socio.findMany({
      where: { activo: true },
      orderBy: { porcentajeParticipacion: 'desc' },
      include: {
        _count: { select: { pagosDistribucion: true } },
      },
    });

    const sumaPorcentajes = socios.reduce(
      (sum, s) => sum + Number(s.porcentajeParticipacion),
      0,
    );

    return {
      socios,
      totalSocios: socios.length,
      sumaPorcentajes,
      participacionCompleta: Math.abs(sumaPorcentajes - 100.0) < 0.01,
    };
  }

  async createSocio(dto: CreateSocioDto) {
    const existing = await this.prisma.socio.findUnique({ where: { rif: dto.rif } });
    if (existing) {
      throw new BadRequestException(`El socio con RIF ${dto.rif} ya está registrado`);
    }

    const { sumaPorcentajes } = await this.getSocios();
    if (sumaPorcentajes + dto.porcentajeParticipacion > 100.01) {
      throw new BadRequestException(
        `La suma de participaciones excedería el 100% (Actual: ${sumaPorcentajes}%, Nuevo: ${dto.porcentajeParticipacion}%)`,
      );
    }

    return this.prisma.socio.create({
      data: {
        nombre: dto.nombre,
        rif: dto.rif,
        email: dto.email,
        telefono: dto.telefono,
        porcentajeParticipacion: new Decimal(dto.porcentajeParticipacion),
        banco: dto.banco,
        numeroCuenta: dto.numeroCuenta,
      },
    });
  }

  // ─── MOTOR DE DISTRIBUCIÓN DE DIVIDENDOS ──────────────────────────────────────

  async simularDistribucion(dto: SimularDistribucionDto, usuarioId: string) {
    const socios = await this.prisma.socio.findMany({
      where: { activo: true },
      orderBy: { porcentajeParticipacion: 'desc' },
    });

    if (socios.length === 0) {
      throw new BadRequestException('No hay socios activos registrados para distribuir dividendos');
    }

    const sumaPorcentajes = socios.reduce(
      (sum, s) => sum + Number(s.porcentajeParticipacion),
      0,
    );
    if (Math.abs(sumaPorcentajes - 100.0) > 0.01) {
      throw new BadRequestException(
        `La participación accionaria debe sumar exactamente el 100% (Actual: ${sumaPorcentajes}%)`,
      );
    }

    const { tasaUsd } = await this.bcvService.getCurrentRate();
    const reservaLiquidez = dto.reservaLiquidezMinimaUsd ?? 50000;

    // Calcular ingresos y egresos contables del período
    const periodo = await this.prisma.periodoContable.findFirst({
      where: { anio: dto.anio, mes: dto.mes },
      include: {
        asientos: {
          where: { estado: 'APROBADO' },
          include: { detalles: { include: { cuenta: true } } },
        },
      },
    });

    let totalIngresosUsd = 0;
    let totalEgresosUsd = 0;

    if (periodo) {
      for (const asiento of periodo.asientos) {
        for (const det of asiento.detalles) {
          if (det.cuenta.tipo === 'INGRESO') {
            totalIngresosUsd += Number(det.haberUsd) - Number(det.debeUsd);
          } else if (det.cuenta.tipo === 'EGRESO') {
            totalEgresosUsd += Number(det.debeUsd) - Number(det.haberUsd);
          }
        }
      }
    }

    // Si aún no hay movimientos contables registrados para el mes, estimar con ingresos de PMS/POS
    if (totalIngresosUsd === 0) {
      const fechaDesde = new Date(dto.anio, dto.mes - 1, 1);
      const fechaHasta = new Date(dto.anio, dto.mes, 0, 23, 59, 59);

      const [cargosFolio, comandas] = await Promise.all([
        this.prisma.cargoFolio.aggregate({
          where: { createdAt: { gte: fechaDesde, lte: fechaHasta } },
          _sum: { montoUsd: true },
        }),
        this.prisma.comanda.aggregate({
          where: { createdAt: { gte: fechaDesde, lte: fechaHasta }, estado: 'CERRADA' },
          _sum: { totalUsd: true },
        }),
      ]);

      totalIngresosUsd = Number(cargosFolio._sum.montoUsd || 0) + Number(comandas._sum.totalUsd || 0);
      totalEgresosUsd = totalIngresosUsd * 0.45; // Costo operativo estimado del 45%
    }

    const utilidadNetaUsd = Math.max(0, totalIngresosUsd - totalEgresosUsd);
    const utilidadNetaBs = utilidadNetaUsd * tasaUsd;

    // REGLA CRÍTICA NO NEGOCIABLE: Fondo de Reserva Operativo de $50,000 USD antes de repartir
    const montoDistribuibleUsd = Math.max(0, utilidadNetaUsd - reservaLiquidez);
    const montoDistribuibleBs = montoDistribuibleUsd * tasaUsd;

    const count = await this.prisma.distribucionDividendo.count();
    const correlativo = generarCorrelativo('DIV', count + 1, dto.anio);

    return this.prisma.$transaction(async (tx) => {
      const distribucion = await tx.distribucionDividendo.create({
        data: {
          correlativo,
          periodoNombre: dto.periodoNombre,
          anio: dto.anio,
          mes: dto.mes,
          baseCalculo: dto.baseCalculo ?? 'UTILIDAD_CONTABLE',
          reservaLiquidezMinimaUsd: new Decimal(reservaLiquidez),
          utilidadNetaUsd: new Decimal(utilidadNetaUsd),
          utilidadNetaBs: new Decimal(utilidadNetaBs),
          montoDistribuibleUsd: new Decimal(montoDistribuibleUsd),
          montoDistribuibleBs: new Decimal(montoDistribuibleBs),
          tasaBcvCongelada: new Decimal(tasaUsd),
          estado: 'SIMULACION',
          creadoPorId: usuarioId,
          lineas: {
            create: socios.map((socio) => {
              const pct = Number(socio.porcentajeParticipacion);
              const mUsd = (montoDistribuibleUsd * pct) / 100;
              const mBs = mUsd * tasaUsd;
              return {
                socioId: socio.id,
                porcentaje: socio.porcentajeParticipacion,
                montoUsd: new Decimal(mUsd),
                montoBs: new Decimal(mBs),
                estadoPago: 'PENDIENTE',
              };
            }),
          },
        },
        include: {
          lineas: { include: { socio: true } },
        },
      });

      return distribucion;
    });
  }

  async findAllDistribuciones() {
    return this.prisma.distribucionDividendo.findMany({
      orderBy: { creadoEn: 'desc' },
      include: {
        lineas: { include: { socio: { select: { nombre: true, rif: true, porcentajeParticipacion: true } } } },
      },
    });
  }

  async findOneDistribucion(id: string) {
    const dist = await this.prisma.distribucionDividendo.findUnique({
      where: { id },
      include: {
        lineas: { include: { socio: true } },
      },
    });
    if (!dist) throw new NotFoundException('Distribución de dividendos no encontrada');
    return dist;
  }

  async aprobarDistribucion(id: string, rol: string, usuarioId: string) {
    const dist = await this.prisma.distribucionDividendo.findUnique({ where: { id } });
    if (!dist) throw new NotFoundException('Distribución no encontrada');
    if (dist.estado !== 'SIMULACION') {
      throw new BadRequestException('Solo se pueden aprobar distribuciones en estado SIMULACION');
    }

    const dataUpdate: any = {};
    if (rol === 'CONTADOR') dataUpdate.aprobadoContadorId = usuarioId;
    if (rol === 'GERENTE_GENERAL' || rol === 'SUPER_ADMIN') dataUpdate.aprobadoGerenteId = usuarioId;

    dataUpdate.estado = 'APROBADO';

    return this.prisma.distribucionDividendo.update({
      where: { id },
      data: dataUpdate,
    });
  }

  // REGLA CRÍTICA NO NEGOCIABLE: Una vez CERRADO_INMUTABLE, jamás se modifica
  async cerrarDistribucionInmutable(id: string) {
    const dist = await this.prisma.distribucionDividendo.findUnique({
      where: { id },
      include: { lineas: { include: { socio: true } } },
    });
    if (!dist) throw new NotFoundException('Distribución no encontrada');
    if (dist.estado === 'CERRADO_INMUTABLE' || dist.estado === 'PAGADO') {
      throw new BadRequestException('Esta distribución ya se encuentra en estado CERRADO INMUTABLE');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Asiento Contable Automático de Distribución de Dividendos
      const cuentaPatrimonio = await tx.cuentaContable.findFirst({
        where: { codigo: '3.1.1' },
      });
      const cuentaPasivoSocios = await tx.cuentaContable.findFirst({
        where: { codigo: '2.1.3' }, // CxP
      });

      let asientoId: string | undefined = undefined;

      if (cuentaPatrimonio && cuentaPasivoSocios && Number(dist.montoDistribuibleUsd) > 0) {
        const periodo = await tx.periodoContable.findFirst({
          where: { anio: dist.anio, mes: dist.mes },
        });

        const numAsientos = await tx.asientoContable.count();
        const correlativoAsiento = generarCorrelativo('ASI', numAsientos + 1, dist.anio);

        const nuevoAsiento = await tx.asientoContable.create({
          data: {
            numero: correlativoAsiento,
            periodoId: periodo?.id || 'periodo-actual',
            fecha: new Date(),
            descripcion: `Distribución inmutable de dividendos ${dist.periodoNombre} (${dist.correlativo})`,
            tipo: 'AUTOMATICO_DISTRIBUCION',
            estado: 'APROBADO',
            creadoPor: dist.creadoPorId,
            tasaBcv: dist.tasaBcvCongelada,
            totalDebeUsd: dist.montoDistribuibleUsd,
            totalHaberUsd: dist.montoDistribuibleUsd,
            totalDebeBs: dist.montoDistribuibleBs,
            totalHaberBs: dist.montoDistribuibleBs,
            detalles: {
              create: [
                {
                  cuentaId: cuentaPatrimonio.id,
                  debeUsd: dist.montoDistribuibleUsd,
                  haberUsd: new Decimal(0),
                  debeBs: dist.montoDistribuibleBs,
                  haberBs: new Decimal(0),
                  descripcion: 'Decreto de dividendos a socios',
                },
                {
                  cuentaId: cuentaPasivoSocios.id,
                  debeUsd: new Decimal(0),
                  haberUsd: dist.montoDistribuibleUsd,
                  debeBs: new Decimal(0),
                  haberBs: dist.montoDistribuibleBs,
                  descripcion: 'Cuentas por pagar a accionistas',
                },
              ],
            },
          },
        });
        asientoId = nuevoAsiento.id;
      }

      // 2. Bloqueo Inmutable
      return tx.distribucionDividendo.update({
        where: { id },
        data: {
          estado: 'CERRADO_INMUTABLE',
          cerradoEn: new Date(),
          asientoContableId: asientoId,
        },
      });
    });
  }

  async registrarPagoSocio(
    distribucionId: string,
    socioId: string,
    dto: RegistrarPagoSocioDto,
  ) {
    const linea = await this.prisma.lineaDistribucionSocio.findUnique({
      where: {
        distribucionId_socioId: { distribucionId, socioId },
      },
    });
    if (!linea) throw new NotFoundException('Línea de distribución no encontrada');

    return this.prisma.lineaDistribucionSocio.update({
      where: { id: linea.id },
      data: {
        estadoPago: 'PAGADO',
        referenciaPago: dto.referenciaPago,
        fechaPago: dto.fechaPago ? new Date(dto.fechaPago) : new Date(),
      },
    });
  }

  // ─── PORTAL DEL SOCIO (VISTA DE SOLO LECTURA) ────────────────────────────────

  async getPortalSocio(socioRifOrId: string) {
    const socio = await this.prisma.socio.findFirst({
      where: {
        OR: [{ id: socioRifOrId }, { rif: socioRifOrId }],
      },
      include: {
        pagosDistribucion: {
          include: { distribucion: true },
          orderBy: { distribucion: { creadoEn: 'desc' } },
        },
      },
    });

    if (!socio) throw new NotFoundException('Socio no encontrado');

    const totalCobradoUsd = socio.pagosDistribucion
      .filter((p) => p.estadoPago === 'PAGADO')
      .reduce((sum, p) => sum + Number(p.montoUsd), 0);

    const totalPendienteUsd = socio.pagosDistribucion
      .filter((p) => p.estadoPago === 'PENDIENTE')
      .reduce((sum, p) => sum + Number(p.montoUsd), 0);

    return {
      socio: {
        id: socio.id,
        nombre: socio.nombre,
        rif: socio.rif,
        porcentajeParticipacion: socio.porcentajeParticipacion,
        banco: socio.banco,
        numeroCuenta: socio.numeroCuenta,
      },
      metricas: {
        totalCobradoUsd,
        totalPendienteUsd,
        distribucionesRegistradas: socio.pagosDistribucion.length,
      },
      historico: socio.pagosDistribucion.map((p) => ({
        distribucionId: p.distribucionId,
        correlativo: p.distribucion.correlativo,
        periodoNombre: p.distribucion.periodoNombre,
        utilidadNetaPeriodoUsd: p.distribucion.utilidadNetaUsd,
        reservaLiquidezUsd: p.distribucion.reservaLiquidezMinimaUsd,
        montoDistribuibleTotalUsd: p.distribucion.montoDistribuibleUsd,
        miPorcentaje: p.porcentaje,
        miMontoUsd: p.montoUsd,
        miMontoBs: p.montoBs,
        tasaBcv: p.distribucion.tasaBcvCongelada,
        estadoPago: p.estadoPago,
        referenciaPago: p.referenciaPago,
        fechaPago: p.fechaPago,
        estadoDistribucion: p.distribucion.estado,
      })),
    };
  }
}
