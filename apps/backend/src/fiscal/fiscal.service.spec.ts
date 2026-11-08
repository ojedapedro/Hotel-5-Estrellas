import { Test, TestingModule } from '@nestjs/testing';
import { FiscalService } from './fiscal.service';
import { PrismaService } from '../prisma/prisma.service';
import { BcvService } from '../bcv/bcv.service';

describe('FiscalService - Reglas Fiscales SENIAT (Venezuela)', () => {
  let service: FiscalService;
  let prismaMock: any;
  let bcvMock: any;

  beforeEach(async () => {
    prismaMock = {
      facturaFiscal: {
        count: jest.fn().mockResolvedValue(100),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'factura-1', ...data })),
      },
      comprobanteRetencion: {
        count: jest.fn().mockResolvedValue(5),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'retencion-1', ...data })),
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
        FiscalService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BcvService, useValue: bcvMock },
      ],
    }).compile();

    service = module.get<FiscalService>(FiscalService);
  });

  it('debe estar definido el servicio fiscal', () => {
    expect(service).toBeDefined();
  });

  it('debe calcular correctamente IVA 16% e IGTF 3% sobre base imponible en divisas', async () => {
    const dto = {
      clienteNombre: 'Corporación Demo C.A.',
      clienteRif: 'J-12345678-9',
      baseImponibleUsd: 1000,
      alicuotaIva: 16,
      alicuotaIgtf: 3,
      origenModulo: 'POS',
    };

    const resultado = await service.emitirFacturaFiscal(dto as any);

    expect(prismaMock.facturaFiscal.create).toHaveBeenCalled();
    const dataEnviada = prismaMock.facturaFiscal.create.mock.calls[0][0].data;

    // Base imponible: $1000 -> IVA: $160 -> IGTF: $30 -> Total: $1190
    expect(Number(dataEnviada.baseImponibleUsd)).toBe(1000);
    expect(Number(dataEnviada.montoIvaUsd)).toBe(160);
    expect(Number(dataEnviada.montoIgtfUsd)).toBe(30);
    expect(Number(dataEnviada.totalUsd)).toBe(1190);

    // En Bolívares con tasa BCV congelada a 36.50:
    // Base Bs: 36,500 | IVA Bs: 5,840 | IGTF Bs: 1,095 | Total Bs: 43,435
    expect(Number(dataEnviada.baseImponibleBs)).toBe(36500);
    expect(Number(dataEnviada.montoIvaBs)).toBe(5840);
    expect(Number(dataEnviada.montoIgtfBs)).toBe(1095);
    expect(Number(dataEnviada.totalBs)).toBe(43435);
    expect(Number(dataEnviada.tasaBcvCongelada)).toBe(36.50);
  });

  it('debe generar comprobante de retención de IVA al 75% correctamente', async () => {
    const dto = {
      tipoRetencion: 'IVA_75' as const,
      periodoFiscal: '2026-11',
      proveedorNombre: 'Distribuidora Polar C.A.',
      proveedorRif: 'J-00000001-0',
      numeroFacturaAfectada: 'FAC-2026-0005',
      numeroControlFactura: '00-00000050',
      totalFacturaBs: 116000,
      baseImponibleBs: 100000,
      ivaTotalBs: 16000,
      porcentajeRetenido: 75,
    };

    await service.generarComprobanteRetencion(dto);

    expect(prismaMock.comprobanteRetencion.create).toHaveBeenCalled();
    const dataRetencion = prismaMock.comprobanteRetencion.create.mock.calls[0][0].data;

    // 75% de 16,000 Bs = 12,000 Bs
    expect(Number(dataRetencion.montoRetenidoBs)).toBe(12000);
    expect(Number(dataRetencion.tasaBcvCongelada)).toBe(36.50);
  });
});
