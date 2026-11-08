import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(email: string, pass: string, twoFactorToken?: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2FA: solo se exige si el usuario lo tiene habilitado y con secreto generado
    const requires2fa = user.twoFactorEnabled && !!user.twoFactorSecret;

    if (requires2fa) {
      if (!twoFactorToken) {
        return {
          requires2fa: true,
          userId: user.id,
          message: 'Se requiere código 2FA de 6 dígitos',
        };
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 1,
      });

      if (!verified) {
        throw new UnauthorizedException('Código 2FA incorrecto o expirado');
      }
    }

    // Actualizar último acceso
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { ultimoAcceso: new Date() },
    });

    // Generar tokens
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      hotelId: user.hotelId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET') || 'default_refresh_secret',
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    // Registrar sesión
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 7);

    await this.prisma.sesion.create({
      data: {
        usuarioId: user.id,
        token: accessToken,
        refreshToken,
        ip: ip || '127.0.0.1',
        userAgent: userAgent || 'N/A',
        expiraEn,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
        hotelId: user.hotelId,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  async refreshToken(refreshTokenStr: string) {
    try {
      const payload = this.jwtService.verify(refreshTokenStr, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'default_refresh_secret',
      });

      const user = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.activo) {
        throw new UnauthorizedException('Usuario inactivo');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        rol: user.rol,
        hotelId: user.hotelId,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  async generate2faSecret(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) throw new BadRequestException('Usuario no encontrado');

    const issuer = this.configService.get('TOTP_ISSUER') || 'HotelERP 5-Stars';
    const secret = speakeasy.generateSecret({
      name: `${issuer} (${user.email})`,
      issuer,
    });

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32,
      qrCodeDataUrl,
    };
  }

  async verifyAndEnable2fa(userId: string, token: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('No hay configuración de 2FA pendiente');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Código 2FA incorrecto');
    }

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { success: true, message: '2FA activado con éxito' };
  }

  async logout(token: string) {
    await this.prisma.sesion.updateMany({
      where: { token, activa: true },
      data: { activa: false },
    });
    return { success: true, message: 'Sesión cerrada correctamente' };
  }
}
