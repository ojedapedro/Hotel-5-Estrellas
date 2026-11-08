import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // ─── Seguridad ───────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());

  // ─── CORS ────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── Prefijo global ──────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Pipes globales ──────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Filtros globales ─────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Interceptores globales ───────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // ─── Swagger ──────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Hotel ERP API')
      .setDescription('Sistema Integrado de Gestión Hotelera — 5 Estrellas')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addTag('auth', 'Autenticación y seguridad')
      .addTag('users', 'Gestión de usuarios')
      .addTag('pms', 'Property Management System')
      .addTag('rooms', 'Habitaciones')
      .addTag('reservations', 'Reservas')
      .addTag('folios', 'Folios y facturación')
      .addTag('pos', 'Punto de venta')
      .addTag('inventory', 'Inventarios')
      .addTag('contabilidad', 'Módulo contable')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // ─── Puerto ───────────────────────────────────────────────────
  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`🏨 Hotel ERP Backend corriendo en: http://localhost:${port}`);
  console.log(`📄 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
