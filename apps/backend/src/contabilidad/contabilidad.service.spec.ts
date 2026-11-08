import { Test, TestingModule } from '@nestjs/testing';
import { ContabilidadService } from './contabilidad.service';
import { PrismaService } from '../prisma/prisma.service';
import { BcvService } from '../bcv/bcv.service';
import { BadRequestException } from '@nestjs/common';
import { EstadoPeriodo } from '@prisma/client';

describe('ContabilidadService - Partida Doble y Moneda Dual', () => {
  let service: ContabilidadService;
  let prismaMock: any;
  let bcvMock: any;

  beforeEach(async () => {
    prismaMock = {
      periodoContable: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'periodo-nov-2026',
          estado: EstadoPeriodo.ABIERTO,
        }),
      },
      asientoContable: {
        count: jest.fn().mockResolvedValue(10),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'asiento-1', ...data })),
      },
      cuentaContable: {
        findMany: jest.fn().mockResolvedValue([]),
      },
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
        ContabilidadService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BcvService, useValue: bcvMock },
      ],
    }).compile();

    service = module.get<ContabilidadService>(ContabilidadService);
  });

  it('debe estar definido el servicio contable', () => {
    expect(service).toBeDefined();
  });

  it('debe registrar un asiento contable que cuadra exactamente (Debe === Haber)', async () => {
    const dto = {
      periodoId: 'periodo-nov-2026',
      fecha: new Date().toISOString(),
      descripcion: 'Ingreso por alojamiento habitación 305',
      detalles: [
        { cuentaId: 'cta-caja-usd', descripcion: 'Caja USD', debeUsd: 150, haberUsd: 0 },
        { cuentaId: 'cta-ingreso-hab', descripcion: 'Ingreso Habitaciones', debeUsd: 0, haberUsd: 150 },
      ],
    };

    const resultado = await service.createAsiento(dto as any, 'user-admin-id');

    expect(prismaMock.asientoContable.create).toHaveBeenCalled();
    const dataAsiento = prismaMock.asientoContable.create.mock.calls[0][0].data;

    expect(Number(dataAsiento.totalDebeUsd)).toBe(150);
    expect(Number(dataAsiento.totalHaberUsd)).toBe(150);
    expect(Number(dataAsiento.totalDebeBs)).toBe(150 * 36.50);
    expect(Number(dataAsiento.totalHaberBs)).toBe(150 * 36.50);
  });

  it('debe lanzar BadRequestException si el asiento está descuadrado (Debe !== Haber)', async () => {
    const dtoDescuadrado = {
      periodoId: 'periodo-nov-2026',
      fecha: new Date().toISOString(),
      descripcion: 'Asiento con descuadre intencional',
      detalles: [
        { cuentaId: 'cta-1', descripcion: 'Caja USD', debeUsd: 200, haberUsd: 0 },
        { cuentaId: 'cta-2', descripcion: 'Ingreso', debeUsd: 0, haberUsd: 180 }, // Faltan $20
      ],
    };

    await expect(service.createAsiento(dtoDescuadrado as any, 'user-admin-id')).rejects.toThrow(
      BadRequestException,
    );
    expect(prismaMock.asientoContable.create).not.toHaveBeenCalled();
  });

  it('debe rechazar asientos en períodos contables cerrados o bloqueados', async () => {
    prismaMock.periodoContable.findUnique.mockResolvedValueOnce({
      id: 'periodo-cerrado',
      estado: EstadoPeriodo.BLOQUEADO,
    });

    const dto = {
      periodoId: 'periodo-cerrado',
      fecha: new Date().toISOString(),
      descripcion: 'Intento en período cerrado',
      detalles: [
        { cuentaId: 'cta-1', debeUsd: 50, haberUsd: 0 },
        { cuentaId: 'cta-2', debeUsd: 0, haberUsd: 50 },
      ],
    };

    await expect(service.createAsiento(dto as any, 'user-admin-id')).rejects.toThrow(
      BadRequestException,
    );
  });
});
