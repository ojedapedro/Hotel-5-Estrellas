import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BcvService } from '../bcv/bcv.service';
import {
  EmitirFacturaFiscalDto,
  GenerarComprobanteRetencionDto,
} from './dto/fiscal.dto';
import { generarCorrelativo } from '@hotel/shared-utils';
import { Decimal } from 'decimal.js';

@Injectable()
export class FiscalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcvService: BcvService,
  ) {}

  // ─── EMISIÓN DE FACTURAS FISCALES ──────────────────────────────────────────

  async emitirFacturaFiscal(dto: EmitirFacturaFiscalDto) {
    const { tasaUsd } = await this.bcvService.getCurrentRate();

    const count = await this.prisma.facturaFiscal.count();
    const year = new Date().getFullYear();
    const numeroFactura = generarCorrelativo('FAC', count + 1, year);
    const numeroControl = `00-${String(count + 1).padStart(8, '0')}`;

    const alicuotaIva = dto.alicuotaIva ?? 16;
    const alicuotaIgtf = dto.alicuotaIgtf ?? 0;

    const baseImponibleUsd = dto.baseImponibleUsd;
    const baseImponibleBs = baseImponibleUsd * tasaUsd;

    const exentoUsd = dto.exentoUsd ?? 0;
    const exentoBs = exentoUsd * tasaUsd;

    const montoIvaUsd = (baseImponibleUsd * alicuotaIva) / 100;
    const montoIvaBs = montoIvaUsd * tasaUsd;

    const montoIgtfUsd = (baseImponibleUsd * alicuotaIgtf) / 100;
    const montoIgtfBs = montoIgtfUsd * tasaUsd;

    const totalUsd = baseImponibleUsd + exentoUsd + montoIvaUsd + montoIgtfUsd;
    const totalBs = totalUsd * tasaUsd;

    return this.prisma.facturaFiscal.create({
      data: {
        numeroFactura,
        numeroControl,
        tipoDocumento: 'FACTURA',
        origenModulo: dto.origenModulo,
        origenId: dto.origenId,
        clienteNombre: dto.clienteNombre,
        clienteRif: dto.clienteRif,
        clienteDireccion: dto.clienteDireccion,
        baseImponibleUsd: new Decimal(baseImponibleUsd),
        baseImponibleBs: new Decimal(baseImponibleBs),
        exentoUsd: new Decimal(exentoUsd),
        exentoBs: new Decimal(exentoBs),
        alicuotaIva: new Decimal(alicuotaIva),
        montoIvaUsd: new Decimal(montoIvaUsd),
        montoIvaBs: new Decimal(montoIvaBs),
        alicuotaIgtf: new Decimal(alicuotaIgtf),
        montoIgtfUsd: new Decimal(montoIgtfUsd),
        montoIgtfBs: new Decimal(montoIgtfBs),
        totalUsd: new Decimal(totalUsd),
        totalBs: new Decimal(totalBs),
        tasaBcvCongelada: new Decimal(tasaUsd),
        estado: 'EMITIDA',
      },
    });
  }

  // ─── LIBRO DE VENTAS SENIAT ────────────────────────────────────────────────

  async getLibroVentas(anio: number, mes: number) {
    const fechaDesde = new Date(anio, mes - 1, 1);
    const fechaHasta = new Date(anio, mes, 0, 23, 59, 59);

    const facturas = await this.prisma.facturaFiscal.findMany({
      where: {
        fechaEmision: { gte: fechaDesde, lte: fechaHasta },
        estado: 'EMITIDA',
      },
      include: { retenciones: true },
      orderBy: { fechaEmision: 'asc' },
    });

    const totales = facturas.reduce(
      (acc, f) => {
        acc.totalVentasBs += Number(f.totalBs);
        acc.baseImponibleBs += Number(f.baseImponibleBs);
        acc.ivaDebitoBs += Number(f.montoIvaBs);
        acc.igtfBs += Number(f.montoIgtfBs);
        acc.exentoBs += Number(f.exentoBs);
        return acc;
      },
      {
        totalVentasBs: 0,
        baseImponibleBs: 0,
        ivaDebitoBs: 0,
        igtfBs: 0,
        exentoBs: 0,
      },
    );

    return {
      periodo: `${String(mes).padStart(2, '0')}/${anio}`,
      totalDocumentos: facturas.length,
      totales,
      filas: facturas.map((f, idx) => ({
        operacion: idx + 1,
        fecha: f.fechaEmision,
        rif: f.clienteRif,
        nombre: f.clienteNombre,
        numeroFactura: f.numeroFactura,
        numeroControl: f.numeroControl,
        tipoDocumento: f.tipoDocumento,
        totalVentasBs: f.totalBs,
        ventasExentasBs: f.exentoBs,
        baseImponibleBs: f.baseImponibleBs,
        alicuotaIva: f.alicuotaIva,
        impuestoIvaBs: f.montoIvaBs,
        igtfBs: f.montoIgtfBs,
        tasaBcv: f.tasaBcvCongelada,
      })),
    };
  }

  // ─── LIBRO DE COMPRAS SENIAT ───────────────────────────────────────────────

  async getLibroCompras(anio: number, mes: number) {
    const fechaDesde = new Date(anio, mes - 1, 1);
    const fechaHasta = new Date(anio, mes, 0, 23, 59, 59);

    const ordenesRecibidas = await this.prisma.ordenCompra.findMany({
      where: {
        creadoEn: { gte: fechaDesde, lte: fechaHasta },
        estado: { in: ['RECIBIDA_TOTAL', 'RECIBIDA_PARCIAL', 'APROBADA'] },
      },
      include: { proveedor: true },
      orderBy: { creadoEn: 'asc' },
    });

    const totales = ordenesRecibidas.reduce(
      (acc, o) => {
        acc.totalComprasBs += Number(o.totalBs);
        acc.baseImponibleBs += Number(o.subtotalUsd) * Number(o.tasaBcvCongelada);
        acc.ivaCreditoBs += Number(o.ivaUsd) * Number(o.tasaBcvCongelada);
        return acc;
      },
      { totalComprasBs: 0, baseImponibleBs: 0, ivaCreditoBs: 0 },
    );

    return {
      periodo: `${String(mes).padStart(2, '0')}/${anio}`,
      totalDocumentos: ordenesRecibidas.length,
      totales,
      filas: ordenesRecibidas.map((o, idx) => ({
        operacion: idx + 1,
        fecha: o.creadoEn,
        rif: o.proveedor.rif,
        proveedor: o.proveedor.nombre,
        numeroOrden: o.correlativo,
        baseImponibleBs: Number(o.subtotalUsd) * Number(o.tasaBcvCongelada),
        ivaCreditoBs: Number(o.ivaUsd) * Number(o.tasaBcvCongelada),
        totalBs: o.totalBs,
        tasaBcv: o.tasaBcvCongelada,
      })),
    };
  }

  // ─── RETENCIONES DE IVA E ISLR ─────────────────────────────────────────────

  async generarComprobanteRetencion(dto: GenerarComprobanteRetencionDto) {
    const { tasaUsd } = await this.bcvService.getCurrentRate();

    const count = await this.prisma.comprobanteRetencion.count();
    const [anio, mes] = dto.periodoFiscal.split('-');
    const numeroComprobante = `${anio}${mes}${String(count + 1).padStart(8, '0')}`;

    const montoRetenidoBs = (dto.ivaTotalBs * dto.porcentajeRetenido) / 100;
    const montoRetenidoUsd = montoRetenidoBs / tasaUsd;

    return this.prisma.comprobanteRetencion.create({
      data: {
        numeroComprobante,
        tipoRetencion: dto.tipoRetencion,
        periodoFiscal: dto.periodoFiscal,
        proveedorNombre: dto.proveedorNombre,
        proveedorRif: dto.proveedorRif,
        numeroFacturaAfectada: dto.numeroFacturaAfectada,
        numeroControlFactura: dto.numeroControlFactura,
        totalFacturaBs: new Decimal(dto.totalFacturaBs),
        baseImponibleBs: new Decimal(dto.baseImponibleBs),
        ivaTotalBs: new Decimal(dto.ivaTotalBs),
        porcentajeRetenido: new Decimal(dto.porcentajeRetenido),
        montoRetenidoBs: new Decimal(montoRetenidoBs),
        montoRetenidoUsd: new Decimal(montoRetenidoUsd),
        tasaBcvCongelada: new Decimal(tasaUsd),
      },
    });
  }

  async getComprobantesRetencion(periodoFiscal?: string) {
    return this.prisma.comprobanteRetencion.findMany({
      where: periodoFiscal ? { periodoFiscal } : {},
      orderBy: { fechaEmision: 'desc' },
    });
  }

  // ─── CALENDARIO FISCAL SENIAT ──────────────────────────────────────────────

  async getCalendarioFiscal() {
    const year = new Date().getFullYear();
    const mes = new Date().getMonth() + 1;

    // Cronograma oficial SENIAT para Contribuyentes Especiales
    return [
      {
        obligacion: 'Declaración de IVA (1ra Quincena)',
        frecuencia: 'QUINCENAL',
        periodo: `${year}-${String(mes).padStart(2, '0')}-Q1`,
        fechaVencimiento: `${year}-${String(mes).padStart(2, '0')}-20`,
        descripcion: 'Enterar débito fiscal menos crédito fiscal y retenciones recibidas',
        estado: 'VIGENTE',
      },
      {
        obligacion: 'Declaración de IVA (2da Quincena)',
        frecuencia: 'QUINCENAL',
        periodo: `${year}-${String(mes).padStart(2, '0')}-Q2`,
        fechaVencimiento: `${year}-${String(mes + 1).padStart(2, '0')}-05`,
        descripcion: 'Cierre de segunda quincena del mes anterior',
        estado: 'PROXIMO',
      },
      {
        obligacion: 'Enteramiento de IGTF (3% Divisas)',
        frecuencia: 'SEMANAL / QUINCENAL',
        periodo: `${year}-${String(mes).padStart(2, '0')}`,
        fechaVencimiento: `${year}-${String(mes).padStart(2, '0')}-22`,
        descripcion: 'Pago en Bolívares del 3% percibido sobre pagos en moneda extranjera',
        estado: 'VIGENTE',
      },
      {
        obligacion: 'Retenciones de ISLR a Proveedores',
        frecuencia: 'MENSUAL',
        periodo: `${year}-${String(mes).padStart(2, '0')}`,
        fechaVencimiento: `${year}-${String(mes).padStart(2, '0')}-25`,
        descripcion: 'Declaración y pago de retenciones de impuesto sobre la renta aplicadas',
        estado: 'VIGENTE',
      },
    ];
  }

  // ─── RESUMEN FISCAL DEL PERÍODO ───────────────────────────────────────────

  async getResumenFiscal(anio: number, mes: number) {
    const [libroVentas, libroCompras] = await Promise.all([
      this.getLibroVentas(anio, mes),
      this.getLibroCompras(anio, mes),
    ]);

    const debitoFiscalBs = libroVentas.totales.ivaDebitoBs;
    const creditoFiscalBs = libroCompras.totales.ivaCreditoBs;
    const igtfPorPagarBs = libroVentas.totales.igtfBs;
    const ivaNetoPorPagarBs = Math.max(0, debitoFiscalBs - creditoFiscalBs);

    const { tasaUsd } = await this.bcvService.getCurrentRate();

    return {
      periodo: `${String(mes).padStart(2, '0')}/${anio}`,
      tasaBcvReferencia: tasaUsd,
      debitoFiscalBs,
      creditoFiscalBs,
      ivaNetoPorPagarBs,
      ivaNetoPorPagarUsd: ivaNetoPorPagarBs / tasaUsd,
      igtfPorPagarBs,
      igtfPorPagarUsd: igtfPorPagarBs / tasaUsd,
      totalVentasBs: libroVentas.totales.totalVentasBs,
      totalComprasBs: libroCompras.totales.totalComprasBs,
    };
  }
}
