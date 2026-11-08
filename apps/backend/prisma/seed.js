"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const decimal_js_1 = require("decimal.js");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🏨 Iniciando Seed de Base de Datos - Hotel 5 Estrellas (Idempotente)...');
    const hotel = await prisma.hotel.upsert({
        where: { rif: 'J-50123456-7' },
        update: {},
        create: {
            nombre: 'Gran Hotel Caracas 5 Estrellas',
            rif: 'J-50123456-7',
            direccionFiscal: 'Av. Principal de Las Mercedes, Caracas, Venezuela',
            telefono: '+58 212 9998888',
            email: 'contacto@granhotelcaracas.com',
            ivaGeneral: new decimal_js_1.Decimal(16),
            ivaReducido: new decimal_js_1.Decimal(8),
            igtfPorcentaje: new decimal_js_1.Decimal(3),
            totalHabitaciones: 200,
            zonaHoraria: 'America/Caracas',
            horaAuditoria: '23:59',
            reservaOperativaUsd: new decimal_js_1.Decimal(50000),
        },
    });
    console.log(`✅ Hotel verificado/creado: ${hotel.nombre}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.tasaBcv.upsert({
        where: {
            hotelId_fecha: {
                hotelId: hotel.id,
                fecha: today,
            },
        },
        update: {},
        create: {
            hotelId: hotel.id,
            fecha: today,
            tasaUsd: new decimal_js_1.Decimal(36.50),
            fuente: 'BCV_OFICIAL',
        },
    });
    console.log('✅ Tasa BCV inicial configurada: 36.50 Bs/USD');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin2026*', salt);
    const usuariosDefault = [
        { email: 'admin@hotel.com', nombre: 'Admin', apellido: 'Sistema', rol: client_1.Role.SUPER_ADMIN },
        { email: 'gerente@hotel.com', nombre: 'Roberto', apellido: 'Mendoza', rol: client_1.Role.GERENTE_GENERAL },
        { email: 'contador@hotel.com', nombre: 'Elena', apellido: 'Gutiérrez', rol: client_1.Role.CONTADOR },
        { email: 'recepcion@hotel.com', nombre: 'Valentina', apellido: 'Morales', rol: client_1.Role.RECEPCIONISTA },
        { email: 'auditor@hotel.com', nombre: 'Carlos', apellido: 'Silva', rol: client_1.Role.AUDITOR_NOCTURNO },
        { email: 'cajero@hotel.com', nombre: 'Manuel', apellido: 'Pérez', rol: client_1.Role.CAJERO_POS },
        { email: 'mesero@hotel.com', nombre: 'Andrés', apellido: 'Rivas', rol: client_1.Role.MESERO },
        { email: 'eventos@hotel.com', nombre: 'Patricia', apellido: 'Gómez', rol: client_1.Role.EJECUTIVO_EVENTOS },
        { email: 'compras@hotel.com', nombre: 'Jorge', apellido: 'Castillo', rol: client_1.Role.COMPRAS_ALMACEN },
        { email: 'rrhh@hotel.com', nombre: 'Mariana', apellido: 'Fernández', rol: client_1.Role.RRHH_NOMINA },
        { email: 'mantenimiento@hotel.com', nombre: 'Luis', apellido: 'Torres', rol: client_1.Role.TECNICO_MANTENIMIENTO },
        { email: 'socioA@hotel.com', nombre: 'Socio A (75%)', apellido: 'Inversionista', rol: client_1.Role.SOCIO },
    ];
    for (const u of usuariosDefault) {
        await prisma.usuario.upsert({
            where: { email: u.email },
            update: {},
            create: {
                hotelId: hotel.id,
                email: u.email,
                passwordHash,
                nombre: u.nombre,
                apellido: u.apellido,
                rol: u.rol,
                activo: true,
            },
        });
    }
    console.log(`✅ ${usuariosDefault.length} Usuarios creados (clave: Admin2026*)`);
    const tiposHab = [
        { nombre: 'Habitación Simple Deluxe', tipo: client_1.TipoHabitacion.SIMPLE, capacidad: 1, precio: 90 },
        { nombre: 'Habitación Doble Superior', tipo: client_1.TipoHabitacion.DOBLE, capacidad: 2, precio: 130 },
        { nombre: 'Master Suite Ejecutiva', tipo: client_1.TipoHabitacion.SUITE, capacidad: 3, precio: 220 },
        { nombre: 'Suite Presidencial Gran Lujo', tipo: client_1.TipoHabitacion.PRESIDENCIAL, capacidad: 4, precio: 450 },
    ];
    const tiposCreados = {};
    for (const th of tiposHab) {
        let record = await prisma.tipoHabitacionCatalogo.findFirst({
            where: { nombre: th.nombre },
        });
        if (!record) {
            record = await prisma.tipoHabitacionCatalogo.create({
                data: {
                    nombre: th.nombre,
                    tipo: th.tipo,
                    capacidad: th.capacidad,
                    descripcion: `Ambiente 5 estrellas con vista panorámica, Wi-Fi alta velocidad y minibar.`,
                    amenidades: ['wifi_alta_velocidad', 'smart_tv_55', 'jacuzzi', 'caja_fuerte', 'minibar'],
                    tarifas: {
                        create: {
                            nombre: 'Tarifa Rack Estándar',
                            precioUsd: new decimal_js_1.Decimal(th.precio),
                            vigenciaDesde: new Date('2026-01-01'),
                        },
                    },
                },
            });
        }
        tiposCreados[th.tipo] = record.id;
    }
    console.log('✅ Catálogo de 4 Tipos de Habitación verificado');
    const habitacionesData = [];
    for (let piso = 1; piso <= 10; piso++) {
        for (let h = 1; h <= 20; h++) {
            const numStr = `${piso}${String(h).padStart(2, '0')}`;
            let tipoEnum = client_1.TipoHabitacion.SIMPLE;
            let estado = client_1.EstadoHabitacion.DISPONIBLE;
            if (h <= 8)
                tipoEnum = client_1.TipoHabitacion.SIMPLE;
            else if (h <= 15)
                tipoEnum = client_1.TipoHabitacion.DOBLE;
            else if (h <= 19)
                tipoEnum = client_1.TipoHabitacion.SUITE;
            else
                tipoEnum = client_1.TipoHabitacion.PRESIDENCIAL;
            if (piso === 2 && (h === 3 || h === 7))
                estado = client_1.EstadoHabitacion.OCUPADA;
            if (piso === 3 && h === 5)
                estado = client_1.EstadoHabitacion.LIMPIEZA;
            if (piso === 4 && h === 12)
                estado = client_1.EstadoHabitacion.MANTENIMIENTO;
            habitacionesData.push({
                numero: numStr,
                tipoId: tiposCreados[tipoEnum],
                piso,
                estado,
            });
        }
    }
    await prisma.habitacion.createMany({
        data: habitacionesData,
        skipDuplicates: true,
    });
    console.log(`✅ 200 Habitaciones verificadas en 10 pisos`);
    const almacenes = [
        { nombre: 'Almacén de Alimentos', departamento: 'Cocina & Restaurante' },
        { nombre: 'Almacén de Bebidas & Licores', departamento: 'Bar & Lounge' },
        { nombre: 'Almacén de Suministros Habitaciones', departamento: 'Housekeeping' },
        { nombre: 'Almacén de Mantenimiento & Repuestos', departamento: 'Mantenimiento' },
        { nombre: 'Almacén General de Suministros', departamento: 'Administración' },
    ];
    for (const alm of almacenes) {
        let exist = await prisma.almacen.findFirst({ where: { nombre: alm.nombre } });
        if (!exist) {
            await prisma.almacen.create({
                data: {
                    nombre: alm.nombre,
                    departamento: alm.departamento,
                    activo: true,
                },
            });
        }
    }
    console.log('✅ 5 Almacenes verificados');
    let pvRest = await prisma.puntoVenta.findFirst({
        where: { nombre: 'Restaurante Gourmet "El Mirador"' },
    });
    if (!pvRest) {
        pvRest = await prisma.puntoVenta.create({
            data: {
                nombre: 'Restaurante Gourmet "El Mirador"',
                area: 'Planta Principal',
                mesas: {
                    create: [
                        { numero: 'M-01', capacidad: 4, estado: 'DISPONIBLE' },
                        { numero: 'M-02', capacidad: 4, estado: 'DISPONIBLE' },
                        { numero: 'M-03', capacidad: 6, estado: 'DISPONIBLE' },
                        { numero: 'M-04', capacidad: 2, estado: 'DISPONIBLE' },
                        { numero: 'M-05', capacidad: 8, estado: 'DISPONIBLE' },
                    ],
                },
            },
        });
    }
    let catPlatos = await prisma.categoriaMenu.findFirst({ where: { nombre: 'Platos Principales' } });
    if (!catPlatos) {
        await prisma.categoriaMenu.create({
            data: {
                nombre: 'Platos Principales',
                orden: 1,
                productos: {
                    create: [
                        { codigo: 'PL-001', nombre: 'Lomito a la Pimienta con Risotto', precioUsd: new decimal_js_1.Decimal(24.50) },
                        { codigo: 'PL-002', nombre: 'Róbalo en Salsa de Mariscos', precioUsd: new decimal_js_1.Decimal(28.00) },
                        { codigo: 'PL-003', nombre: 'Pabellón Criollo Gourmet', precioUsd: new decimal_js_1.Decimal(16.00) },
                    ],
                },
            },
        });
    }
    let catBebidas = await prisma.categoriaMenu.findFirst({ where: { nombre: 'Bebidas & Coctelería' } });
    if (!catBebidas) {
        await prisma.categoriaMenu.create({
            data: {
                nombre: 'Bebidas & Coctelería',
                orden: 2,
                productos: {
                    create: [
                        { codigo: 'BEB-001', nombre: 'Ron Añejo Santa Teresa 1796', precioUsd: new decimal_js_1.Decimal(12.00) },
                        { codigo: 'BEB-002', nombre: 'Mojito Cubano Clásico', precioUsd: new decimal_js_1.Decimal(8.50) },
                        { codigo: 'BEB-003', nombre: 'Vino Tinto Reserva (Copa)', precioUsd: new decimal_js_1.Decimal(9.00) },
                    ],
                },
            },
        });
    }
    console.log('✅ Restaurante, Mesas y Menú verificados');
    const cuentasBase = [
        { codigo: '1', nombre: 'ACTIVO', tipo: client_1.TipoCuenta.ACTIVO, nivel: 1, esMovimiento: false },
        { codigo: '1.1', nombre: 'ACTIVO CIRCULANTE', tipo: client_1.TipoCuenta.ACTIVO, nivel: 2, esMovimiento: false },
        { codigo: '1.1.1', nombre: 'Caja Principal USD', tipo: client_1.TipoCuenta.ACTIVO, nivel: 3, esMovimiento: true },
        { codigo: '1.1.2', nombre: 'Caja Principal Bolívares', tipo: client_1.TipoCuenta.ACTIVO, nivel: 3, esMovimiento: true },
        { codigo: '1.1.3', nombre: 'Banco Nacional VES (Banesco)', tipo: client_1.TipoCuenta.ACTIVO, nivel: 3, esMovimiento: true },
        { codigo: '1.1.4', nombre: 'Cuentas por Cobrar Huéspedes', tipo: client_1.TipoCuenta.ACTIVO, nivel: 3, esMovimiento: true },
        { codigo: '2', nombre: 'PASIVO', tipo: client_1.TipoCuenta.PASIVO, nivel: 1, esMovimiento: false },
        { codigo: '2.1', nombre: 'PASIVO CIRCULANTE', tipo: client_1.TipoCuenta.PASIVO, nivel: 2, esMovimiento: false },
        { codigo: '2.1.1', nombre: 'IVA Débito Fiscal por Pagar', tipo: client_1.TipoCuenta.PASIVO, nivel: 3, esMovimiento: true },
        { codigo: '2.1.2', nombre: 'IGTF por Enterar (3%)', tipo: client_1.TipoCuenta.PASIVO, nivel: 3, esMovimiento: true },
        { codigo: '2.1.3', nombre: 'Cuentas por Pagar Proveedores', tipo: client_1.TipoCuenta.PASIVO, nivel: 3, esMovimiento: true },
        { codigo: '3', nombre: 'PATRIMONIO', tipo: client_1.TipoCuenta.PATRIMONIO, nivel: 1, esMovimiento: false },
        { codigo: '3.1.1', nombre: 'Capital Social', tipo: client_1.TipoCuenta.PATRIMONIO, nivel: 3, esMovimiento: true },
        { codigo: '4', nombre: 'INGRESOS', tipo: client_1.TipoCuenta.INGRESO, nivel: 1, esMovimiento: false },
        { codigo: '4.1.1', nombre: 'Ingresos por Alojamiento / Habitaciones', tipo: client_1.TipoCuenta.INGRESO, nivel: 3, esMovimiento: true },
        { codigo: '4.1.2', nombre: 'Ingresos por Alimentos y Bebidas (POS)', tipo: client_1.TipoCuenta.INGRESO, nivel: 3, esMovimiento: true },
        { codigo: '4.1.3', nombre: 'Ingresos por Eventos y Salones', tipo: client_1.TipoCuenta.INGRESO, nivel: 3, esMovimiento: true },
        { codigo: '5', nombre: 'EGRESOS Y COSTOS', tipo: client_1.TipoCuenta.EGRESO, nivel: 1, esMovimiento: false },
        { codigo: '5.1.1', nombre: 'Costo de Ventas Alimentos y Bebidas', tipo: client_1.TipoCuenta.EGRESO, nivel: 3, esMovimiento: true },
        { codigo: '5.2.1', nombre: 'Gastos de Nómina y Personal', tipo: client_1.TipoCuenta.EGRESO, nivel: 3, esMovimiento: true },
    ];
    for (const c of cuentasBase) {
        await prisma.cuentaContable.upsert({
            where: { codigo: c.codigo },
            update: {},
            create: {
                codigo: c.codigo,
                nombre: c.nombre,
                tipo: c.tipo,
                nivel: c.nivel,
                esMovimiento: c.esMovimiento,
                activa: true,
            },
        });
    }
    console.log('✅ Plan de cuentas contable base verificado');
    await prisma.periodoContable.upsert({
        where: {
            hotelId_anio_mes: {
                hotelId: hotel.id,
                anio: 2026,
                mes: 11,
            },
        },
        update: {},
        create: {
            hotelId: hotel.id,
            anio: 2026,
            mes: 11,
            estado: client_1.EstadoPeriodo.ABIERTO,
        },
    });
    console.log('✅ Período Contable Noviembre 2026 verificado');
    const salonesDemo = [
        { nombre: 'Gran Salón Bolívar', capacidadMax: 500, precioHoraUsd: 150.00, ubicacion: 'Nivel Mezzanina' },
        { nombre: 'Terraza El Ávila', capacidadMax: 150, precioHoraUsd: 85.00, ubicacion: 'Piso 11 Rooftop' },
        { nombre: 'Sala de Juntas VIP', capacidadMax: 30, precioHoraUsd: 45.00, ubicacion: 'Piso 1 Centro de Negocios' },
    ];
    for (const s of salonesDemo) {
        const exist = await prisma.salon.findFirst({ where: { nombre: s.nombre } });
        if (!exist) {
            await prisma.salon.create({
                data: {
                    nombre: s.nombre,
                    capacidadMaxima: s.capacidadMax,
                    precioHoraUsd: new decimal_js_1.Decimal(s.precioHoraUsd),
                    descripcion: s.ubicacion,
                    activo: true,
                },
            });
        }
    }
    console.log('✅ 3 Salones de Eventos verificados/creados');
    const sociosDemo = [
        {
            nombre: 'Inversiones Ávila Gold C.A.',
            rif: 'J-40112233-4',
            email: 'contacto@avilagold.com',
            telefono: '+58 212 9001122',
            porcentajeParticipacion: 75.0,
            banco: 'Banesco Banco Universal',
            numeroCuenta: '0134-0001-11-0001234567',
        },
        {
            nombre: 'Grupo Hotelero del Caribe S.A.',
            rif: 'J-40998877-6',
            email: 'finanzas@grupocaribe.com',
            telefono: '+58 212 9003344',
            porcentajeParticipacion: 25.0,
            banco: 'Banco Mercantil',
            numeroCuenta: '0105-0022-33-0009876543',
        },
    ];
    for (const s of sociosDemo) {
        await prisma.socio.upsert({
            where: { rif: s.rif },
            update: {},
            create: {
                nombre: s.nombre,
                rif: s.rif,
                email: s.email,
                telefono: s.telefono,
                porcentajeParticipacion: new decimal_js_1.Decimal(s.porcentajeParticipacion),
                banco: s.banco,
                numeroCuenta: s.numeroCuenta,
                activo: true,
            },
        });
    }
    console.log('✅ 2 Socios creados con participación 75% + 25% = 100.0%');
    const proveedoresDemo = [
        {
            nombre: 'Distribuidora de Alimentos Polar C.A.',
            rif: 'J-00000001-0',
            direccion: 'Los Cortijos de Lourdes, Caracas',
            telefono: '+58 212 2023333',
            email: 'ventas@polar.com',
            diasCredito: 15,
            esAgenteRetencion: true,
        },
        {
            nombre: 'Licores y Bebidas Premium Caracas C.A.',
            rif: 'J-00000002-1',
            direccion: 'Boleíta Norte, Caracas',
            telefono: '+58 212 2345566',
            email: 'pedidos@premiumcaracas.com',
            diasCredito: 30,
            esAgenteRetencion: false,
        },
    ];
    for (const p of proveedoresDemo) {
        await prisma.proveedor.upsert({
            where: { rif: p.rif },
            update: {},
            create: {
                nombre: p.nombre,
                rif: p.rif,
                direccion: p.direccion,
                telefono: p.telefono,
                email: p.email,
                creditoDiasDefault: p.diasCredito,
                activo: true,
            },
        });
    }
    console.log('✅ 2 Proveedores demo verificados');
    const articulosDemo = [
        { codigo: 'ART-001', nombre: 'Lomito de Res Calidad Angus (Kg)', unidad: 'KG', stockMinimo: 20 },
        { codigo: 'ART-002', nombre: 'Arroz Premium Grano Largo (Kg)', unidad: 'KG', stockMinimo: 50 },
        { codigo: 'ART-003', nombre: 'Ron Santa Teresa 1796 (Botella 750ml)', unidad: 'BOT', stockMinimo: 12 },
        { codigo: 'ART-004', nombre: 'Set Jabón y Champú Amenities 50ml', unidad: 'PACK', stockMinimo: 200 },
        { codigo: 'ART-005', nombre: 'Bombillos LED 12W Blanco Cálido', unidad: 'UND', stockMinimo: 30 },
    ];
    for (const art of articulosDemo) {
        await prisma.articulo.upsert({
            where: { codigo: art.codigo },
            update: {},
            create: {
                codigo: art.codigo,
                nombre: art.nombre,
                unidadMedida: art.unidad,
                stockMinimo: new decimal_js_1.Decimal(art.stockMinimo),
                activo: true,
            },
        });
    }
    console.log('✅ 5 Artículos de inventario demo verificados');
    const empleadosDemo = [
        {
            cedula: 'V-19888777',
            nombre: 'Valentina',
            apellido: 'Morales',
            cargo: 'Recepcionista Principal',
            departamento: 'Recepción & Front Desk',
            fechaIngreso: new Date('2024-01-15'),
            sueldoBaseUsd: 450.00,
        },
        {
            cedula: 'V-18222333',
            nombre: 'Carlos',
            apellido: 'Silva',
            cargo: 'Chef Ejecutivo',
            departamento: 'Cocina & Restaurante',
            fechaIngreso: new Date('2023-06-01'),
            sueldoBaseUsd: 850.00,
        },
        {
            cedula: 'V-20111444',
            nombre: 'Luis',
            apellido: 'Torres',
            cargo: 'Técnico Especialista en Climatización',
            departamento: 'Mantenimiento General',
            fechaIngreso: new Date('2024-03-10'),
            sueldoBaseUsd: 500.00,
        },
    ];
    for (const emp of empleadosDemo) {
        await prisma.empleado.upsert({
            where: { cedula: emp.cedula },
            update: {},
            create: {
                cedula: emp.cedula,
                nombre: emp.nombre,
                apellido: emp.apellido,
                cargo: emp.cargo,
                departamento: emp.departamento,
                fechaIngreso: emp.fechaIngreso,
                salarioBaseUsd: new decimal_js_1.Decimal(emp.sueldoBaseUsd),
                tipoContrato: 'TIEMPO_INDETERMINADO',
                estado: 'ACTIVO',
            },
        });
    }
    console.log('✅ 3 Empleados demo verificados');
    console.log('🎉 SEED COMPLETADO CON ÉXITO: 11 MÓDULOS CON DATOS INICIALES LISTOS.');
}
main()
    .catch((e) => {
    console.error('❌ Error en Seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map