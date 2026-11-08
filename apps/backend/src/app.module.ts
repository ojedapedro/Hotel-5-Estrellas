import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PmsModule } from './pms/pms.module';
import { PosModule } from './pos/pos.module';
import { InventoryModule } from './inventory/inventory.module';
import { ContabilidadModule } from './contabilidad/contabilidad.module';
import { BcvModule } from './bcv/bcv.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { TasksModule } from './tasks/tasks.module';
// Fase 2
import { ComprasModule } from './compras/compras.module';
import { EventosModule } from './eventos/eventos.module';
import { RrhhModule } from './rrhh/rrhh.module';
import { MantenimientoModule } from './mantenimiento/mantenimiento.module';
// Fase 3 - Módulos finales
import { SociosModule } from './socios/socios.module';
import { FiscalModule } from './fiscal/fiscal.module';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: 60_000,
          limit: 100,
        },
        {
          name: 'auth',
          ttl: 60_000,
          limit: Number(config.get('AUTH_THROTTLE_LIMIT', 10)),
        },
      ],
    }),

    // Tareas programadas (cron auditoría nocturna, etc.)
    ScheduleModule.forRoot(),

    // ─── Módulos Fase 1 ──────────────────────────────────────
    PrismaModule,
    AuthModule,
    UsersModule,
    PmsModule,
    PosModule,
    InventoryModule,
    ContabilidadModule,
    BcvModule,
    WebsocketsModule,
    TasksModule,

    // ─── Módulos Fase 2 ──────────────────────────────────────
    ComprasModule,
    EventosModule,
    RrhhModule,
    MantenimientoModule,
    SociosModule,
    FiscalModule,
  ],
})
export class AppModule {}
