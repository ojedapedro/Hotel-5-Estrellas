#!/bin/bash
# ============================================================
# deploy.sh — Script de Despliegue Manual Hotel ERP
# Uso desde el VPS: bash deploy.sh
# ============================================================
set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorio del proyecto en el VPS
PROJECT_DIR="/opt/hotel-erp"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🏨 Hotel ERP — Deploy Producción     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ── Verificar que estamos en el directorio correcto ──────────
if [ ! -f "$PROJECT_DIR/docker-compose.prod.yml" ]; then
  echo -e "${RED}❌ Error: No se encontró docker-compose.prod.yml en $PROJECT_DIR${NC}"
  exit 1
fi

cd "$PROJECT_DIR"

# ── Paso 1: Pull de código ───────────────────────────────────
echo -e "${YELLOW}[1/7] ⬇️  Obteniendo últimos cambios de Git...${NC}"
git pull origin main
echo -e "${GREEN}✓ Código actualizado${NC}"
echo ""

# ── Paso 2: Verificar archivo .env ──────────────────────────
echo -e "${YELLOW}[2/7] 🔐 Verificando variables de entorno...${NC}"
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ Error: Falta el archivo .env en $PROJECT_DIR${NC}"
  echo -e "${YELLOW}   Copia .env.prod.example → .env y configura los valores${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Variables de entorno OK${NC}"
echo ""

# ── Paso 3: Build de contenedores ───────────────────────────
echo -e "${YELLOW}[3/7] 🐳 Construyendo imágenes Docker...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache backend
echo -e "${GREEN}✓ Imágenes construidas${NC}"
echo ""

# ── Paso 4: Levantar servicios ───────────────────────────────
echo -e "${YELLOW}[4/7] 🚀 Levantando servicios...${NC}"
docker compose -f docker-compose.prod.yml up -d --remove-orphans
echo -e "${GREEN}✓ Contenedores corriendo${NC}"
echo ""

# ── Paso 5: Esperar DB ───────────────────────────────────────
echo -e "${YELLOW}[5/7] ⏳ Esperando que PostgreSQL esté listo...${NC}"
RETRIES=10
until docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U hotel_admin -d hotel_erp 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    echo -e "${RED}❌ Timeout esperando PostgreSQL${NC}"
    exit 1
  fi
  echo "   Reintentando... ($RETRIES intentos restantes)"
  sleep 5
done
echo -e "${GREEN}✓ PostgreSQL listo${NC}"
echo ""

# ── Paso 6: Migraciones Prisma ──────────────────────────────
echo -e "${YELLOW}[6/7] 🗄️  Ejecutando migraciones de base de datos...${NC}"
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
echo -e "${GREEN}✓ Migraciones aplicadas${NC}"
echo ""

# ── Paso 7: Limpiar imágenes viejas ─────────────────────────
echo -e "${YELLOW}[7/7] 🧹 Limpiando recursos Docker obsoletos...${NC}"
docker image prune -f
echo -e "${GREEN}✓ Limpieza completada${NC}"
echo ""

# ── Resumen ──────────────────────────────────────────────────
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Deploy completado exitosamente!   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 Backend API:  ${BLUE}http://localhost:3001${NC}"
echo -e "  📚 Swagger Docs: ${BLUE}http://localhost:3001/api/docs${NC}"
echo -e "  🗄️  DB Status:   $(docker compose -f docker-compose.prod.yml ps postgres --format 'table {{.Status}}')"
echo -e "  ⚡ Redis Status: $(docker compose -f docker-compose.prod.yml ps redis --format 'table {{.Status}}')"
echo ""
echo -e "  Logs en tiempo real: ${YELLOW}docker compose -f docker-compose.prod.yml logs -f backend${NC}"
