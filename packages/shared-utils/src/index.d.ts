import { MetodoPago } from "@hotel/shared-types";
export declare function roundTo(val: number, decimals?: number): number;
export declare function usdToVes(montoUsd: number, tasaBcv: number): number;
export declare function vesToUsd(montoVes: number, tasaBcv: number): number;
export declare function requiereIgtf(metodo: MetodoPago): boolean;
export declare function calcularIgtf(montoOriginal: number, metodo: MetodoPago, alicuota?: number): number;
export declare function calcularIva(baseImponible: number, alicuota?: number): number;
export declare function generarCorrelativo(prefix: string, secuencia: number, anio?: number): string;
export declare function formatUsd(amount: number): string;
export declare function formatVes(amount: number): string;
//# sourceMappingURL=index.d.ts.map