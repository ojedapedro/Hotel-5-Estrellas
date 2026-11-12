# ============================================================
# Dockerfile — Hotel ERP Backend (NestJS + Prisma)
# Multi-stage build: builder → runner
# ============================================================

# ---- Etapa 1: Builder ----
FROM node:20-alpine AS builder

# Habilitar corepack para pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar manifiestos del workspace primero (mejor cache)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY apps/backend/package.json ./apps/backend/

# Instalar TODAS las dependencias (incluyendo devDeps para build)
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY tsconfig.base.json ./
COPY packages/shared-types/ ./packages/shared-types/
COPY packages/shared-utils/ ./packages/shared-utils/
COPY apps/backend/ ./apps/backend/

# Build de paquetes compartidos
RUN pnpm --filter @hotel/shared-types build
RUN pnpm --filter @hotel/shared-utils build

# Generar Prisma Client
RUN cd apps/backend && npx prisma generate

# Build del backend
RUN pnpm --filter backend build

# ---- Etapa 2: Runner (imagen final liviana) ----
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

# Instalar cliente de PostgreSQL para health checks
RUN apk add --no-cache postgresql-client

WORKDIR /app

ENV NODE_ENV=production

# Copiar manifiestos para instalar solo dependencias de producción
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile --prod

# Copiar artefactos del builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist

# Copiar Prisma Client generado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

WORKDIR /app/apps/backend

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

CMD ["node", "dist/main"]
