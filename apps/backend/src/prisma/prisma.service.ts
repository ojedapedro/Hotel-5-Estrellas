import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Limpia la base de datos para pruebas (sólo en entorno test).
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase sólo disponible en entorno test');
    }

    const models = Reflect.ownKeys(this).filter((key) =>
      typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'),
    );

    return Promise.all(models.map((model) => (this as any)[model].deleteMany()));
  }
}
