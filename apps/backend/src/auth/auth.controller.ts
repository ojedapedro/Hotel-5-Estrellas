import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { Verify2FaDto } from './dto/verify-2fa.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña (y 2FA si aplica)' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto.email, dto.password, dto.twoFactorToken, ip, userAgent);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión actual' })
  async logout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('me')
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  async getProfile(@CurrentUser() user: any) {
    return { data: user };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('2fa/generate')
  @ApiOperation({ summary: 'Generar clave y QR de 2FA para el usuario' })
  async generate2fa(@CurrentUser('id') userId: string) {
    return this.authService.generate2faSecret(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('2fa/verify-enable')
  @ApiOperation({ summary: 'Verificar código y habilitar 2FA' })
  async verifyAndEnable2fa(
    @CurrentUser('id') userId: string,
    @Body() dto: Verify2FaDto,
  ) {
    return this.authService.verifyAndEnable2fa(userId, dto.token);
  }
}
