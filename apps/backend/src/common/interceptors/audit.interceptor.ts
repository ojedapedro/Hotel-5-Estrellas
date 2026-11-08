import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, ip, user } = request;

    // Registrar solo métodos mutables: POST, PUT, PATCH, DELETE
    const shouldAudit = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap({
        next: async (data) => {
          if (shouldAudit && this.prisma) {
            try {
              const urlParts = url.split('?')[0].split('/');
              const modulo = urlParts[3] || 'GENERAL';
              const accion = method;

              await this.prisma.bitacoraAuditoria.create({
                data: {
                  tabla: modulo,
                  registroId: data?.id || data?.data?.id || 'N/A',
                  accion,
                  datosAntes: undefined,
                  datosDespues: body ? JSON.parse(JSON.stringify(body)) : undefined,
                  usuarioId: user?.id || null,
                  ip: ip || '127.0.0.1',
                  userAgent: request.headers['user-agent'] || 'API-Client',
                  modulo,
                  descripcion: `${method} en ${url}`,
                },
              });
            } catch (err: any) {
              this.logger.warn(`No se pudo registrar bitácora de auditoría: ${err.message}`);
            }
          }
        },
      }),
    );
  }
}
