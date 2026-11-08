import { MetodoPago } from '@hotel/shared-types';

/**
 * Redondea un número a decimales específicos (por defecto 2 para UI, 4 para BD)
 */
export function roundTo(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Convierte USD a VES dada una tasa BCV
 */
export function usdToVes(montoUsd: number, tasaBcv: number): number {
  return roundTo(montoUsd * tasaBcv, 2);
}

/**
 * Convierte VES a USD dada una tasa BCV
 */
export function vesToUsd(montoVes: number, tasaBcv: number): number {
  if (tasaBcv <= 0) return 0;
  return roundTo(montoVes / tasaBcv, 2);
}

/**
 * Determina si un método de pago paga en divisas y aplica IGTF (3%)
 */
export function requiereIgtf(metodo: MetodoPago): boolean {
  return [
    MetodoPago.EFECTIVO_USD,
    MetodoPago.TARJETA_CREDITO_INT,
    MetodoPago.ZELLE,
    MetodoPago.TRANSFERENCIA_USD,
    MetodoPago.BINANCE,
  ].includes(metodo);
}

/**
 * Calcula IGTF si aplica
 */
export function calcularIgtf(montoOriginal: number, metodo: MetodoPago, alicuota: number = 3): number {
  if (!requiereIgtf(metodo)) return 0;
  return roundTo((montoOriginal * alicuota) / 100, 2);
}

/**
 * Calcula IVA general venezolano (16% por defecto)
 */
export function calcularIva(baseImponible: number, alicuota: number = 16): number {
  return roundTo((baseImponible * alicuota) / 100, 2);
}

/**
 * Genera un código correlativo con formato PREFIX-YYYY-XXXXX
 */
export function generarCorrelativo(prefix: string, secuencia: number, anio: number = new Date().getFullYear()): string {
  const pad = String(secuencia).padStart(5, '0');
  return `${prefix}-${anio}-${pad}`;
}

/**
 * Formateador de moneda en USD
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formateador de moneda en VES (Bolívares)
 */
export function formatVes(amount: number): string {
  return `Bs. ${new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}
