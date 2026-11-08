import { Test, TestingModule } from '@nestjs/testing';
import { SociosService } from './socios.service';
import { PrismaService } from '../prisma/prisma.service';
import { BcvService } from '../bcv/bcv.service';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from 'decimal.js';

describe('SociosService - Dividendos y Regla de Participación 100%', () => {
  let service: SociosService;
  let prismaMock: any;
  let bcvMock: any;

  beforeEach(async () => {
    prismaMock = {
      socio: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'socio-1', nombre: 'Socio Mayoritario', rif: 'J-11111111-1', porcentajeParticipacion: new Decimal(75.0), activo: true },
          { id: 'socio-2', nombre: 'Socio Minoritario', rif: 'J-22222222-2', porcentajeParticipacion: new Decimal(25.0), activo: true },
        ]),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      periodoContable: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      cargoFolio: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { montoUsd: new Decimal(100000) } }),
      },
      comanda: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalUsd: new Decimal(50000) } }),
      },
      distribucionDividendo: {
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn().mockImplementation((cb) =>
        cb({
          distribucionDividendo: {
            create: jest.fn().mockImplementation(({ data }) =>
              Promise.resolve({
                id: 'dist-1',
                ...data,
                lineas: data.lineas.create,
              }),
            ),
          },
        }),
      ),
    };

    bcvMock = {
      getCurrentRate: jest.fn().mockResolvedValue({
        tasaUsd: 36.50,
        fecha: new Date(),
        fuente: 'BCV_OFICIAL',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SociosService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BcvService, useValue: bcvMock },
      ],
    }).compile();

    service = module.get<SociosService>(SociosService);
  });

  it('debe estar definido el servicio de socios', () => {
    expect(service).toBeDefined();
  });

  it('debe validar que los socios activos sumen exactamente el 100% de participación', async () => {
    const listado = await service.getSocios();
    expect(listado.totalSocios).toBe(2);
    expect(listado.sumaPorcentajes).toBe(100.0);
    expect(listado.participacionCompleta).toBe(true);
  });

  it('debe descontar la reserva de liquidez obligatoria de $50,000 USD antes de repartir dividendos', async () => {
    // Ingresos estimados: $100k + $50k = $150k. Egresos 45% = $67.5k. Utilidad neta = $82.5k
    // Reserva mínima = $50k. Monto distribuible = $82.5k - $50k = $32.5k
    const dto = {
      periodoNombre: 'Noviembre 2026',
      anio: 2026,
      mes: 11,
      reservaLiquidezMinimaUsd: 50000,
    };

    const resultado = await service.simularDistribucion(dto as any, 'user-admin-id');

    expect(resultado).toBeDefined();
    // Utilidad: 150000 - 67500 = 82500
    expect(Number(resultado.utilidadNetaUsd)).toBe(82500);
    expect(Number(resultado.reservaLiquidezMinimaUsd)).toBe(50000);
    // Distribuible = 82500 - 50000 = 32500
    expect(Number(resultado.montoDistribuibleUsd)).toBe(32500);

    // Reparto por socio:
    // Socio 1 (75%): 32500 * 0.75 = $24,375 USD
    // Socio 2 (25%): 32500 * 0.25 = $8,125 USD
    const lineas = (resultado as any).lineas;
    expect(Number(lineas[0].montoUsd)).toBe(24375);
    expect(Number(lineas[1].montoUsd)).toBe(8125);
  });

  it('debe rechazar la simulación de dividendos si la suma de participación accionaria es != 100%', async () => {
    prismaMock.socio.findMany.mockResolvedValueOnce([
      { id: 'socio-1', nombre: 'Socio Incompleto', rif: 'J-11111111-1', porcentajeParticipacion: new Decimal(60.0), activo: true },
    ]);

    const dto = {
      periodoNombre: 'Período Inválido',
      anio: 2026,
      mes: 11,
    };

    await expect(service.simularDistribucion(dto as any, 'user-admin-id')).rejects.toThrow(
      BadRequestException,
    );
  });
});
