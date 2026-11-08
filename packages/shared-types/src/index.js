"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoMovimientoInventario = exports.EstadoMesa = exports.EstadoComanda = exports.MetodoPago = exports.TipoCargoFolio = exports.EstadoFolio = exports.CanalReserva = exports.EstadoReserva = exports.TipoHabitacion = exports.EstadoHabitacion = exports.Moneda = exports.ActionKey = exports.ModuleKey = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
    Role["GERENTE_GENERAL"] = "GERENTE_GENERAL";
    Role["CONTADOR"] = "CONTADOR";
    Role["RECEPCIONISTA"] = "RECEPCIONISTA";
    Role["AUDITOR_NOCTURNO"] = "AUDITOR_NOCTURNO";
    Role["CAJERO_POS"] = "CAJERO_POS";
    Role["MESERO"] = "MESERO";
    Role["EJECUTIVO_EVENTOS"] = "EJECUTIVO_EVENTOS";
    Role["COMPRAS_ALMACEN"] = "COMPRAS_ALMACEN";
    Role["RRHH_NOMINA"] = "RRHH_NOMINA";
    Role["TECNICO_MANTENIMIENTO"] = "TECNICO_MANTENIMIENTO";
    Role["SOCIO"] = "SOCIO";
})(Role || (exports.Role = Role = {}));
var ModuleKey;
(function (ModuleKey) {
    ModuleKey["ADMIN"] = "ADMIN";
    ModuleKey["FISCAL"] = "FISCAL";
    ModuleKey["CONTABILIDAD"] = "CONTABILIDAD";
    ModuleKey["PMS"] = "PMS";
    ModuleKey["POS"] = "POS";
    ModuleKey["EVENTOS"] = "EVENTOS";
    ModuleKey["INVENTARIOS"] = "INVENTARIOS";
    ModuleKey["COMPRAS"] = "COMPRAS";
    ModuleKey["RRHH"] = "RRHH";
    ModuleKey["MANTENIMIENTO"] = "MANTENIMIENTO";
    ModuleKey["SOCIOS"] = "SOCIOS";
    ModuleKey["REPORTES"] = "REPORTES";
    ModuleKey["DASHBOARD"] = "DASHBOARD";
    ModuleKey["AUDITORIA"] = "AUDITORIA";
})(ModuleKey || (exports.ModuleKey = ModuleKey = {}));
var ActionKey;
(function (ActionKey) {
    ActionKey["CREATE"] = "CREATE";
    ActionKey["READ"] = "READ";
    ActionKey["UPDATE"] = "UPDATE";
    ActionKey["DELETE"] = "DELETE";
    ActionKey["APPROVE"] = "APPROVE";
    ActionKey["CLOSE"] = "CLOSE";
    ActionKey["EXPORT"] = "EXPORT";
})(ActionKey || (exports.ActionKey = ActionKey = {}));
var Moneda;
(function (Moneda) {
    Moneda["USD"] = "USD";
    Moneda["VES"] = "VES";
    Moneda["EUR"] = "EUR";
})(Moneda || (exports.Moneda = Moneda = {}));
var EstadoHabitacion;
(function (EstadoHabitacion) {
    EstadoHabitacion["DISPONIBLE"] = "DISPONIBLE";
    EstadoHabitacion["OCUPADA"] = "OCUPADA";
    EstadoHabitacion["BLOQUEADA"] = "BLOQUEADA";
    EstadoHabitacion["LIMPIEZA"] = "LIMPIEZA";
    EstadoHabitacion["MANTENIMIENTO"] = "MANTENIMIENTO";
    EstadoHabitacion["FUERA_SERVICIO"] = "FUERA_SERVICIO";
})(EstadoHabitacion || (exports.EstadoHabitacion = EstadoHabitacion = {}));
var TipoHabitacion;
(function (TipoHabitacion) {
    TipoHabitacion["SIMPLE"] = "SIMPLE";
    TipoHabitacion["DOBLE"] = "DOBLE";
    TipoHabitacion["SUITE"] = "SUITE";
    TipoHabitacion["PRESIDENCIAL"] = "PRESIDENCIAL";
})(TipoHabitacion || (exports.TipoHabitacion = TipoHabitacion = {}));
var EstadoReserva;
(function (EstadoReserva) {
    EstadoReserva["TENTATIVA"] = "TENTATIVA";
    EstadoReserva["CONFIRMADA"] = "CONFIRMADA";
    EstadoReserva["GARANTIZADA"] = "GARANTIZADA";
    EstadoReserva["CHECKIN"] = "CHECKIN";
    EstadoReserva["CHECKOUT"] = "CHECKOUT";
    EstadoReserva["CANCELADA"] = "CANCELADA";
    EstadoReserva["NO_SHOW"] = "NO_SHOW";
})(EstadoReserva || (exports.EstadoReserva = EstadoReserva = {}));
var CanalReserva;
(function (CanalReserva) {
    CanalReserva["MOSTRADOR"] = "MOSTRADOR";
    CanalReserva["WEB"] = "WEB";
    CanalReserva["TELEFONO"] = "TELEFONO";
    CanalReserva["OTA_BOOKING"] = "OTA_BOOKING";
    CanalReserva["OTA_EXPEDIA"] = "OTA_EXPEDIA";
    CanalReserva["OTA_AIRBNB"] = "OTA_AIRBNB";
    CanalReserva["DIRECTO_CORPORATIVO"] = "DIRECTO_CORPORATIVO";
})(CanalReserva || (exports.CanalReserva = CanalReserva = {}));
var EstadoFolio;
(function (EstadoFolio) {
    EstadoFolio["ABIERTO"] = "ABIERTO";
    EstadoFolio["CERRADO"] = "CERRADO";
    EstadoFolio["ANULADO"] = "ANULADO";
})(EstadoFolio || (exports.EstadoFolio = EstadoFolio = {}));
var TipoCargoFolio;
(function (TipoCargoFolio) {
    TipoCargoFolio["HABITACION"] = "HABITACION";
    TipoCargoFolio["POS"] = "POS";
    TipoCargoFolio["EVENTO"] = "EVENTO";
    TipoCargoFolio["MINIBAR"] = "MINIBAR";
    TipoCargoFolio["LAVANDERIA"] = "LAVANDERIA";
    TipoCargoFolio["TELEFONO"] = "TELEFONO";
    TipoCargoFolio["MANUAL"] = "MANUAL";
    TipoCargoFolio["IGTF"] = "IGTF";
    TipoCargoFolio["IVA"] = "IVA";
})(TipoCargoFolio || (exports.TipoCargoFolio = TipoCargoFolio = {}));
var MetodoPago;
(function (MetodoPago) {
    MetodoPago["EFECTIVO_USD"] = "EFECTIVO_USD";
    MetodoPago["EFECTIVO_VES"] = "EFECTIVO_VES";
    MetodoPago["TARJETA_DEBITO"] = "TARJETA_DEBITO";
    MetodoPago["TARJETA_CREDITO_NAC"] = "TARJETA_CREDITO_NAC";
    MetodoPago["TARJETA_CREDITO_INT"] = "TARJETA_CREDITO_INT";
    MetodoPago["PAGO_MOVIL"] = "PAGO_MOVIL";
    MetodoPago["ZELLE"] = "ZELLE";
    MetodoPago["TRANSFERENCIA_USD"] = "TRANSFERENCIA_USD";
    MetodoPago["TRANSFERENCIA_VES"] = "TRANSFERENCIA_VES";
    MetodoPago["BINANCE"] = "BINANCE";
    MetodoPago["CARGO_HABITACION"] = "CARGO_HABITACION";
})(MetodoPago || (exports.MetodoPago = MetodoPago = {}));
var EstadoComanda;
(function (EstadoComanda) {
    EstadoComanda["ABIERTA"] = "ABIERTA";
    EstadoComanda["ENVIADA_COCINA"] = "ENVIADA_COCINA";
    EstadoComanda["EN_PREPARACION"] = "EN_PREPARACION";
    EstadoComanda["LISTA"] = "LISTA";
    EstadoComanda["ENTREGADA"] = "ENTREGADA";
    EstadoComanda["CERRADA"] = "CERRADA";
    EstadoComanda["ANULADA"] = "ANULADA";
})(EstadoComanda || (exports.EstadoComanda = EstadoComanda = {}));
var EstadoMesa;
(function (EstadoMesa) {
    EstadoMesa["DISPONIBLE"] = "DISPONIBLE";
    EstadoMesa["OCUPADA"] = "OCUPADA";
    EstadoMesa["RESERVADA"] = "RESERVADA";
    EstadoMesa["LIMPIEZA"] = "LIMPIEZA";
})(EstadoMesa || (exports.EstadoMesa = EstadoMesa = {}));
var TipoMovimientoInventario;
(function (TipoMovimientoInventario) {
    TipoMovimientoInventario["ENTRADA_COMPRA"] = "ENTRADA_COMPRA";
    TipoMovimientoInventario["ENTRADA_DEVOLUCION"] = "ENTRADA_DEVOLUCION";
    TipoMovimientoInventario["SALIDA_CONSUMO"] = "SALIDA_CONSUMO";
    TipoMovimientoInventario["SALIDA_RECETA"] = "SALIDA_RECETA";
    TipoMovimientoInventario["SALIDA_MERMA"] = "SALIDA_MERMA";
    TipoMovimientoInventario["TRANSFERENCIA_ENTRADA"] = "TRANSFERENCIA_ENTRADA";
    TipoMovimientoInventario["TRANSFERENCIA_SALIDA"] = "TRANSFERENCIA_SALIDA";
    TipoMovimientoInventario["AJUSTE_POSITIVO"] = "AJUSTE_POSITIVO";
    TipoMovimientoInventario["AJUSTE_NEGATIVO"] = "AJUSTE_NEGATIVO";
    TipoMovimientoInventario["CONTEO_FISICO"] = "CONTEO_FISICO";
})(TipoMovimientoInventario || (exports.TipoMovimientoInventario = TipoMovimientoInventario = {}));
//# sourceMappingURL=index.js.map