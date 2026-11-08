# 🏨 Sistema Integrado ERP + PMS — Gran Hotel Caracas 5 Estrellas (Venezuela)

Sistema integral de gestión hotelera y empresarial desarrollado con arquitectura modular para hoteles de lujo de 200 habitaciones en Venezuela, cumpliendo estrictamente con la normativa legal, fiscal y laboral venezolana (SENIAT, BCV, LOTTT, IVSS, FAOV, INCES).

---

## 🏛️ Stack Tecnológico

- **Monorepo:** [Turborepo 2](https://turbo.build/) + [pnpm v12](https://pnpm.io/)
- **Backend:** [NestJS 11](https://nestjs.com/) + TypeScript + [Prisma ORM 6](https://www.prisma.io/)
- **Frontend:** [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/) + [Zustand](https://zustand-demo.pmnd.rs/) + [Lucide Icons](https://lucide.dev/)
- **Base de Datos:** PostgreSQL 15 + Redis 7
- **Tiempo Real:** WebSockets con Socket.io (eventos de ama de llaves, habitaciones y cocina KDS)
- **Tema Visual:** Dark Luxury Theme con acentos dorados (`#D4AF37`) y soporte responsive
- **Testing:** Jest + Ts-Jest (11/11 pruebas unitarias aprobadas para reglas críticas de negocio)

---

## 🧩 Los 11 Módulos Implementados

| N° | Módulo | Descripción Funcional y Cumplimiento |
|---|---|---|
| **1** | **PMS & Front Desk** | Mapa de 200 habitaciones (10 pisos x 20 habs), check-in/out, folios de huéspedes con cargos multimoneda. |
| **2** | **Fiscal y SENIAT** | Facturación electrónica con N° Control/Factura, Libros SENIAT de Compras y Ventas, IGTF 3%, Retenciones IVA (75%/100%) e ISLR, y Calendario de Contribuyentes Especiales. |
| **3** | **Contabilidad Dual** | Partida doble estricta (`Debe === Haber`), moneda dual nativa (USD y Bs), plan de cuentas jerárquico y balance general. |
| **4** | **Restaurante y POS** | Comandas de mesa con división de cuenta, comanda de cocina KDS en tiempo real, cargos automáticos a folios de habitación. |
| **5** | **Almacenes e Inventarios** | 5 almacenes especializados (Alimentos, Bebidas, Habitaciones, Mantenimiento, General), Kardex ponderado y alertas de stock mínimo. |
| **6** | **Compras y Proveedores** | Gestión de proveedores con RIF y días de crédito, órdenes de compra con aprobación de gerencia y recepción en almacén con recálculo de costo promedio. |
| **7** | **Eventos y Banquetes** | Gestión de salones (Gran Salón Bolívar 500 pax, Terraza El Ávila 150 pax, Sala VIP), cotizaciones de eventos con itinerarios y anticipos. |
| **8** | **Nómina y RRHH** | Expediente de empleados, cálculo quincenal y mensual con deducciones oficiales venezolanas (IVSS 4%, FAOV 1%, INCES 0.5%) y bono de alimentación. |
| **9** | **Housekeeping y Mantenimiento** | Tablero visual de estado de habitaciones (Limpia, Sucia, Inspección, Mantenimiento), órdenes de trabajo técnicas (OT) y cambios vía WebSocket. |
| **10** | **Auditoría Nocturna** | Cron programado a las 23:59 para cierre diario automático, cargo de tarifa noche a folios activos y generación de asiento contable de ingresos. |
| **11** | **Socios e Inversionistas** | Registro de composición accionaria (verificación 100%), motor de dividendos con deducción obligatoria de reserva mínima de liquidez de $50,000 USD, cierre inmutable y portal de lectura para accionistas. |

---

## 🚀 Puesta en Marcha Rápida

### 1. Prerrequisitos
- Node.js >= 20
- pnpm >= 10 (`npm install -g pnpm`)
- Docker Desktop (para PostgreSQL y Redis)

### 2. Iniciar Servicios de Infraestructura (Docker)
```bash
docker-compose up -d
```
Servicios levantados:
- **PostgreSQL 15:** `localhost:5432` (db: `hotel_db`, user: `hotel_admin`, pass: `Hotel2026*Secure!`)
- **Redis 7:** `localhost:6379`
- **pgAdmin 4 (Opcional):** `http://localhost:5050` (user: `admin@hotel.com`, pass: `Admin2026*`)

### 3. Migración y Sembrado de Datos (Seed)
```bash
cd apps/backend
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma db seed
```
El seed es **100% idempotente** y carga:
- El Hotel matriz y la tasa BCV oficial
- Los 12 usuarios demostrativos con los 11 roles
- El catálogo de 4 tipos de habitaciones y las **200 habitaciones** físicas en 10 pisos
- Los 5 almacenes departamentales y artículos demo
- El restaurante gourmet "El Mirador", 5 mesas y catálogo de menú
- El plan de cuentas contable completo
- 3 Salones de banquetes
- 2 Proveedores demo calificados
- 3 Empleados demo en nómina
- 2 Socios accionistas con participación 75% + 25% = 100%

### 4. Compilación y Ejecución
```bash
# Compilar todo el monorepo (4 paquetes exitosos)
pnpm build

# Ejecutar pruebas unitarias de reglas críticas de negocio
cd apps/backend && pnpm test

# Iniciar ambos entornos en desarrollo
pnpm dev
```
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
- **Documentación Swagger:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 👥 Matriz de Roles y Credenciales Demo

> **Contraseña universal para todos los usuarios demo:** `Admin2026*`

| Rol del Sistema | Correo Electrónico | Módulo / Pantalla Principal |
|---|---|---|
| **SUPER_ADMIN** | `admin@hotel.com` | Acceso irrestricto total a todos los módulos y configuración |
| **GERENTE_GENERAL** | `gerente@hotel.com` | Dashboard ejecutivo, aprobación de dividendos, compras y cierres |
| **CONTADOR** | `contador@hotel.com` | Contabilidad dual, Asientos, Libros SENIAT, Retenciones y Dividendos |
| **RECEPCIONISTA** | `recepcion@hotel.com` | Mapa 200 habitaciones, Check-in / Check-out, Folios |
| **AUDITOR_NOCTURNO** | `auditor@hotel.com` | Cierre diario a las 23:59, cargos automáticos de estancia |
| **CAJERO_POS** | `cajero@hotel.com` | Comandas del restaurante, cobros mixtos y recargo de IGTF 3% |
| **MESERO** | `mesero@hotel.com` | Toma de pedidos por mesa y despacho a cocina KDS |
| **EJECUTIVO_EVENTOS** | `eventos@hotel.com` | Cotizaciones y reservas de los 3 salones de eventos |
| **COMPRAS_ALMACEN** | `compras@hotel.com` | Órdenes de compra a proveedores y gestión de los 5 almacenes |
| **RRHH_NOMINA** | `rrhh@hotel.com` | Nómina de empleados, vacaciones y deducciones IVSS/FAOV |
| **TECNICO_MANTENIMIENTO** | `mantenimiento@hotel.com` | Tablero de Housekeeping y órdenes de trabajo técnicas (OT) |
| **SOCIO** | `socioA@hotel.com` | Portal del accionista (solo lectura de dividendos y participaciones) |

---

## 🇻🇪 Reglas No Negociables del Modelo Venezolano

1. **Tasa BCV Congelada por Transacción:** Toda operación almacena `montoUsd`, `montoBs` y `tasaBcvCongelada` al momento exacto de la transacción para proteger la integridad contable ante variaciones cambiarias.
2. **IGTF 3% Obligatorio en Divisas:** Recargo automático sobre pagos en USD en efectivo, Zelle, tarjetas internacionales y criptomonedas.
3. **Reserva Operativa de $50,000 USD en Dividendos:** Antes de decretar dividendos a accionistas, se deduce obligatoriamente este fondo de reserva operativa de liquidez.
4. **Validación Accionaria 100%:** No se permite emitir simulaciones de dividendos si la suma de participaciones activas no es exactamente 100.0%.
5. **Inmutabilidad Contable:** Prohibido el borrado físico (`DELETE`); toda corrección se efectúa mediante comprobantes de anulación o asientos de reversa con doble partida.
