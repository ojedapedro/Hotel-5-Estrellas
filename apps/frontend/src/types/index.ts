export type Role =
  | 'SUPER_ADMIN'
  | 'GERENTE_GENERAL'
  | 'CONTADOR'
  | 'RECEPCIONISTA'
  | 'AUDITOR_NOCTURNO'
  | 'CAJERO_POS'
  | 'MESERO'
  | 'EJECUTIVO_EVENTOS'
  | 'COMPRAS_ALMACEN'
  | 'RRHH_NOMINA'
  | 'TECNICO_MANTENIMIENTO'
  | 'SOCIO';

export type EstadoHabitacion =
  | 'DISPONIBLE'
  | 'OCUPADA'
  | 'BLOQUEADA'
  | 'LIMPIEZA'
  | 'MANTENIMIENTO'
  | 'FUERA_SERVICIO';

export type TipoHabitacion = 'SIMPLE' | 'DOBLE' | 'SUITE' | 'PRESIDENCIAL';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Role;
  hotelId: string;
  twoFactorEnabled?: boolean;
}

export interface Habitacion {
  id: string;
  numero: string;
  piso: number;
  estado: EstadoHabitacion;
  tipo: {
    id: string;
    nombre: string;
    tipo: TipoHabitacion;
    capacidad: number;
  };
  estancias?: any[];
}
