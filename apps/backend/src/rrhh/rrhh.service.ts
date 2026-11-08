import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEmpleadoDto,
  UpdateEmpleadoDto,
  CreateNominaDto,
  RegistrarVacacionesDto,
  EstadoEmpleado,
  EstadoNomina,
} from './dto/rrhh.dto';

@Injectable()
export class RrhhService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── EMPLEADOS ───────────────────────────────────────────────────────────────

  async createEmpleado(dto: CreateEmpleadoDto, creadorId: string) {
    const existing = await this.prisma.empleado.findUnique({ where: { cedula: dto.cedula } });
    if (existing) throw new BadRequestException(`Empleado con cédula ${dto.cedula} ya existe`);

    return this.prisma.empleado.create({
      data: {
        cedula: dto.cedula,
        nombre: dto.nombre,
        apellido: dto.apellido,
        cargo: dto.cargo,
        departamento: dto.departamento,
        fechaIngreso: new Date(dto.fechaIngreso),
        salarioBaseUsd: dto.salarioBaseUsd,
        tipoContrato: dto.tipoContrato,
        email: dto.email,
        telefono: dto.telefono,
        banco: dto.banco,
        numeroCuenta: dto.numeroCuenta,
        tipoMonedaCuenta: dto.tipoMonedaCuenta ?? 'USD',
        usuarioId: dto.usuarioId,
        estado: EstadoEmpleado.ACTIVO,
        creadoPorId: creadorId,
      },
    });
  }

  async findAllEmpleados(estado?: EstadoEmpleado, departamento?: string) {
    return this.prisma.empleado.findMany({
      where: {
        ...(estado && { estado }),
        ...(departamento && { departamento }),
      },
      include: { usuario: { select: { email: true, rol: true } } },
      orderBy: [{ departamento: 'asc' }, { apellido: 'asc' }],
    });
  }

  async findOneEmpleado(id: string) {
    const emp = await this.prisma.empleado.findUnique({
      where: { id },
      include: {
        usuario: { select: { email: true, rol: true } },
        nominas: {
          take: 6,
          select: {
            id: true,
            totalNetoUsd: true,
            totalNetoBs: true,
            nomina: { select: { periodoNombre: true, estado: true, fechaPago: true } },
          },
        },
        vacaciones: { take: 5, orderBy: { fechaInicio: 'desc' } },
      },
    });
    if (!emp) throw new NotFoundException('Empleado no encontrado');
    return emp;
  }

  async updateEmpleado(id: string, dto: UpdateEmpleadoDto) {
    const emp = await this.prisma.empleado.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('Empleado no encontrado');
    return this.prisma.empleado.update({ where: { id }, data: { ...dto } });
  }

  async getDepartamentos() {
    return this.prisma.empleado.groupBy({
      by: ['departamento'],
      _count: { _all: true },
      where: { estado: EstadoEmpleado.ACTIVO },
    });
  }

  // ─── VACACIONES ──────────────────────────────────────────────────────────────

  async registrarVacaciones(dto: RegistrarVacacionesDto, aprobadorId: string) {
    const emp = await this.prisma.empleado.findUnique({ where: { id: dto.empleadoId } });
    if (!emp) throw new NotFoundException('Empleado no encontrado');
    if (emp.estado !== EstadoEmpleado.ACTIVO) throw new BadRequestException('Empleado no activo');

    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = new Date(dto.fechaFin);
    const dias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));

    await this.prisma.empleado.update({
      where: { id: dto.empleadoId },
      data: { estado: EstadoEmpleado.VACACIONES },
    });

    return this.prisma.vacacion.create({
      data: {
        empleadoId: dto.empleadoId,
        fechaInicio,
        fechaFin,
        dias,
        notas: dto.notas,
        aprobadoPorId: aprobadorId,
      },
    });
  }

  // ─── NÓMINA ──────────────────────────────────────────────────────────────────

  async createNomina(dto: CreateNominaDto, creadorId: string) {
    const tasa = await this.prisma.tasaBcv.findFirst({ orderBy: { fecha: 'desc' } });
    const tasaValor = tasa ? Number(tasa.tasaUsd) : 36.50;

    const empleados = await this.prisma.empleado.findMany({
      where: { estado: { in: [EstadoEmpleado.ACTIVO, EstadoEmpleado.VACACIONES] } },
    });

    if (empleados.length === 0) throw new BadRequestException('No hay empleados activos');

    return this.prisma.$transaction(async (tx) => {
      const nominaCreada = await tx.nomina.create({
        data: {
          periodoNombre: dto.periodoNombre,
          fechaDesde: new Date(dto.fechaDesde),
          fechaHasta: new Date(dto.fechaHasta),
          fechaPago: new Date(dto.fechaPago),
          tasaBcvCongelada: tasaValor,
          creadoPorId: creadorId,
          estado: EstadoNomina.CALCULADA,
          totalBrutoUsd: 0,
          totalDeduccionesUsd: 0,
          totalNetoUsd: 0,
          totalBrutoBs: 0,
          totalDeducciones: 0,
          totalNetoBs: 0,
        },
      });

      let totalBrutoUsd = 0;
      let totalDeduccionesUsd = 0;

      for (const emp of empleados) {
        // Deducciones Ley venezolana: IVSS 4%, FAOV 1%, LPH 0.5%
        const salarioBs = Number(emp.salarioBaseUsd) * tasaValor;
        const ivss = Number(emp.salarioBaseUsd) * 0.04;
        const faov = Number(emp.salarioBaseUsd) * 0.01;
        const lph = Number(emp.salarioBaseUsd) * 0.005;
        const totalDedEmp = ivss + faov + lph;
        const totalNetoEmp = Number(emp.salarioBaseUsd) - totalDedEmp;

        totalBrutoUsd += Number(emp.salarioBaseUsd);
        totalDeduccionesUsd += totalDedEmp;

        await tx.lineaNomina.create({
          data: {
            nominaId: nominaCreada.id,
            empleadoId: emp.id,
            salarioBaseUsd: emp.salarioBaseUsd,
            salarioBaseBs: salarioBs,
            asignacionesUsd: 0,
            deduccionesUsd: totalDedEmp,
            ivss,
            faov,
            lph,
            totalBrutoUsd: emp.salarioBaseUsd,
            totalBrutoBs: salarioBs,
            totalNetoUsd: totalNetoEmp,
            totalNetoBs: totalNetoEmp * tasaValor,
            tasaBcvCongelada: tasaValor,
          },
        });
      }

      const totalNetoUsd = totalBrutoUsd - totalDeduccionesUsd;

      return tx.nomina.update({
        where: { id: nominaCreada.id },
        data: {
          totalBrutoUsd,
          totalDeduccionesUsd,
          totalNetoUsd,
          totalBrutoBs: totalBrutoUsd * tasaValor,
          totalDeducciones: totalDeduccionesUsd * tasaValor,
          totalNetoBs: totalNetoUsd * tasaValor,
        },
      });
    });
  }

  async findAllNominas() {
    return this.prisma.nomina.findMany({
      orderBy: { creadoEn: 'desc' },
      include: {
        creadoPor: { select: { nombre: true } },
        _count: { select: { lineas: true } },
      },
    });
  }

  async findOneNomina(id: string) {
    const nomina = await this.prisma.nomina.findUnique({
      where: { id },
      include: {
        lineas: {
          include: {
            empleado: {
              select: { nombre: true, apellido: true, cargo: true, departamento: true },
            },
          },
        },
      },
    });
    if (!nomina) throw new NotFoundException('Nómina no encontrada');
    return nomina;
  }

  async aprobarNomina(id: string, aprobadorId: string) {
    const nomina = await this.prisma.nomina.findUnique({ where: { id } });
    if (!nomina) throw new NotFoundException('Nómina no encontrada');
    if (nomina.estado !== EstadoNomina.CALCULADA)
      throw new BadRequestException('Solo se puede aprobar una nómina calculada');

    return this.prisma.nomina.update({
      where: { id },
      data: { estado: EstadoNomina.APROBADA, aprobadoPorId: aprobadorId, aprobadoEn: new Date() },
    });
  }

  async pagarNomina(id: string) {
    const nomina = await this.prisma.nomina.findUnique({ where: { id } });
    if (!nomina) throw new NotFoundException('Nómina no encontrada');
    if (nomina.estado !== EstadoNomina.APROBADA)
      throw new BadRequestException('Solo se puede pagar una nómina aprobada');

    return this.prisma.nomina.update({
      where: { id },
      data: { estado: EstadoNomina.PAGADA, pagadoEn: new Date() },
    });
  }

  async getKPIs() {
    const [totalActivos, porDepartamento, nominaMes] = await Promise.all([
      this.prisma.empleado.count({ where: { estado: EstadoEmpleado.ACTIVO } }),
      this.prisma.empleado.groupBy({
        by: ['departamento'],
        _count: { _all: true },
        where: { estado: EstadoEmpleado.ACTIVO },
        orderBy: { _count: { departamento: 'desc' } },
      }),
      this.prisma.nomina.findFirst({
        orderBy: { creadoEn: 'desc' },
        select: {
          periodoNombre: true,
          totalNetoUsd: true,
          totalNetoBs: true,
          estado: true,
        },
      }),
    ]);

    return { totalActivos, porDepartamento, nominaMes };
  }
}
