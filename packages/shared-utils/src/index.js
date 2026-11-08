"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundTo = roundTo;
exports.usdToVes = usdToVes;
exports.vesToUsd = vesToUsd;
exports.requiereIgtf = requiereIgtf;
exports.calcularIgtf = calcularIgtf;
exports.calcularIva = calcularIva;
exports.generarCorrelativo = generarCorrelativo;
exports.formatUsd = formatUsd;
exports.formatVes = formatVes;
const shared_types_1 = require("@hotel/shared-types");
function roundTo(val, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round((val + Number.EPSILON) * factor) / factor;
}
function usdToVes(montoUsd, tasaBcv) {
    return roundTo(montoUsd * tasaBcv, 2);
}
function vesToUsd(montoVes, tasaBcv) {
    if (tasaBcv <= 0)
        return 0;
    return roundTo(montoVes / tasaBcv, 2);
}
function requiereIgtf(metodo) {
    return [
        shared_types_1.MetodoPago.EFECTIVO_USD,
        shared_types_1.MetodoPago.TARJETA_CREDITO_INT,
        shared_types_1.MetodoPago.ZELLE,
        shared_types_1.MetodoPago.TRANSFERENCIA_USD,
        shared_types_1.MetodoPago.BINANCE,
    ].includes(metodo);
}
function calcularIgtf(montoOriginal, metodo, alicuota = 3) {
    if (!requiereIgtf(metodo))
        return 0;
    return roundTo((montoOriginal * alicuota) / 100, 2);
}
function calcularIva(baseImponible, alicuota = 16) {
    return roundTo((baseImponible * alicuota) / 100, 2);
}
function generarCorrelativo(prefix, secuencia, anio = new Date().getFullYear()) {
    const pad = String(secuencia).padStart(5, '0');
    return `${prefix}-${anio}-${pad}`;
}
function formatUsd(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
}
function formatVes(amount) {
    return `Bs. ${new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)}`;
}
//# sourceMappingURL=index.js.map