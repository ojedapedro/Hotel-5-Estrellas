#!/bin/bash
# ============================================================
# setup-vps.sh — Configuración inicial del servidor VPS
# Ejecutar UNA SOLA VEZ en el servidor de producción
# Sistema: Ubuntu 22.04 LTS
#
# Uso: bash setup-vps.sh
# ============================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🖥️  Hotel ERP — Setup Servidor VPS   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Actualizar sistema ────────────────────────────────────
echo -e "${YELLOW}[1/8] 📦 Actualizando sistema operativo...${NC}"
apt-get update && apt-get upgrade -y
echo -e "${GREEN}✓ Sistema actualizado${NC}"

# ── 2. Instalar dependencias base ────────────────────────────
echo -e "${YELLOW}[2/8] 🔧 Instalando dependencias base...${NC}"
apt-get install -y \
  curl \
  git \
  nginx \
  certbot \
  python3-certbot-nginx \
  ufw \
  htop \
  unzip

echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# ── 3. Instalar Docker ───────────────────────────────────────
echo -e "${YELLOW}[3/8] 🐳 Instalando Docker...${NC}"
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
echo -e "${GREEN}✓ Docker instalado: $(docker --version)${NC}"

# ── 4. Instalar Docker Compose ───────────────────────────────
echo -e "${YELLOW}[4/8] 🐙 Instalando Docker Compose...${NC}"
apt-get install -y docker-compose-plugin
echo -e "${GREEN}✓ Docker Compose: $(docker compose version)${NC}"

# ── 5. Configurar Firewall ───────────────────────────────────
echo -e "${YELLOW}[5/8] 🔥 Configurando firewall UFW...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh        # Puerto 22
ufw allow 'Nginx Full' # Puertos 80 y 443
# IMPORTANTE: No exponer 3001, 5432, 6379 al exterior
ufw --force enable
echo -e "${GREEN}✓ Firewall configurado${NC}"

# ── 6. Crear directorio del proyecto ────────────────────────
echo -e "${YELLOW}[6/8] 📂 Creando estructura de directorios...${NC}"
mkdir -p /opt/hotel-erp
mkdir -p /var/www/hotel-erp
mkdir -p /var/log/hotel-erp
echo -e "${GREEN}✓ Directorios creados${NC}"

# ── 7. Configurar Nginx ──────────────────────────────────────
echo -e "${YELLOW}[7/8] 🌐 Configurando Nginx...${NC}"
# Eliminar configuración default
rm -f /etc/nginx/sites-enabled/default
systemctl enable nginx
systemctl start nginx
echo -e "${GREEN}✓ Nginx listo${NC}"

# ── 8. Clonar repositorio ────────────────────────────────────
echo -e "${YELLOW}[8/8] 📥 Clonando repositorio...${NC}"
echo ""
echo -e "${YELLOW}  ⚠️  Ahora debes clonar tu repositorio manualmente:${NC}"
echo ""
echo -e "  cd /opt/hotel-erp"
echo -e "  git clone https://github.com/TU_USUARIO/hotel-erp.git ."
echo ""
echo -e "  Luego crea el archivo .env:"
echo -e "  cp .env.prod.example .env"
echo -e "  nano .env   # Configurar contraseñas reales"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Servidor configurado exitosamente!║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Próximo paso: configurar SSL con Certbot:"
echo -e "  ${YELLOW}sudo certbot --nginx -d tu-dominio.com -d api.tu-dominio.com${NC}"
