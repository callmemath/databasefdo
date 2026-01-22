#!/bin/bash

# ============================================
# 🚀 Script di Setup per DatabaseFDO
# Ubuntu 22.04 + MariaDB
# ============================================

set -e  # Esci in caso di errore

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================"
echo "  🚀 Setup DatabaseFDO - Ubuntu 22.04"
echo "============================================"
echo -e "${NC}"

# Funzione per stampare messaggi
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# ============================================
# 1. AGGIORNAMENTO SISTEMA
# ============================================
echo -e "\n${BLUE}[1/7] Aggiornamento sistema...${NC}"
sudo apt update && sudo apt upgrade -y
print_status "Sistema aggiornato"

# ============================================
# 2. INSTALLAZIONE NODE.JS 20
# ============================================
echo -e "\n${BLUE}[2/7] Installazione Node.js 20 LTS...${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        print_status "Node.js $(node -v) già installato"
    else
        print_warning "Node.js versione troppo vecchia, aggiornamento..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

print_status "Node.js $(node -v) - npm $(npm -v)"

# ============================================
# 3. INSTALLAZIONE MARIADB (se non presente)
# ============================================
echo -e "\n${BLUE}[3/7] Configurazione MariaDB...${NC}"

if ! command -v mariadb &> /dev/null; then
    print_warning "MariaDB non trovato, installazione..."
    sudo apt install -y mariadb-server
    sudo systemctl start mariadb
    sudo systemctl enable mariadb
fi

print_status "MariaDB installato e attivo"

# ============================================
# 4. CONFIGURAZIONE DATABASE
# ============================================
echo -e "\n${BLUE}[4/7] Configurazione database...${NC}"

# Chiedi le credenziali
echo ""
read -p "Nome utente database [fdo_user]: " DB_USER
DB_USER=${DB_USER:-fdo_user}

read -sp "Password database: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    print_error "La password non può essere vuota!"
    exit 1
fi

read -p "Nome database FDO [fdo_database]: " DB_NAME
DB_NAME=${DB_NAME:-fdo_database}

read -p "Nome database FiveM/IARP [fivem_database]: " DB_IARP
DB_IARP=${DB_IARP:-fivem_database}

# Crea database e utente
sudo mariadb <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS ${DB_IARP} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('${DB_PASSWORD}');
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON ${DB_IARP}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

print_status "Database configurati: ${DB_NAME}, ${DB_IARP}"

# ============================================
# 5. CONFIGURAZIONE .ENV
# ============================================
echo -e "\n${BLUE}[5/7] Configurazione variabili d'ambiente...${NC}"

# Genera chiave segreta
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Chiedi URL
read -p "URL dell'applicazione [http://localhost:3000]: " APP_URL
APP_URL=${APP_URL:-http://localhost:3000}

# Crea file .env
cat > .env <<EOF
# ============================================
# Database FDO (MariaDB)
# ============================================
DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@localhost:3306/${DB_NAME}"

# ============================================
# Database FiveM/IARP (MariaDB)
# ============================================
DATABASE_URL_IARP="mysql://${DB_USER}:${DB_PASSWORD}@localhost:3306/${DB_IARP}"

# ============================================
# NextAuth Configuration
# ============================================
NEXTAUTH_URL="${APP_URL}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# ============================================
# Discord Webhooks (opzionale)
# ============================================
DISCORD_WEBHOOK_URL=""
DISCORD_WEBHOOK_ARRESTS=""
DISCORD_WEBHOOK_REPORTS=""
DISCORD_WEBHOOK_WANTED=""
EOF

print_status "File .env creato"

# ============================================
# 6. INSTALLAZIONE DIPENDENZE E BUILD
# ============================================
echo -e "\n${BLUE}[6/7] Installazione dipendenze e build...${NC}"

# Installa dipendenze
npm install
print_status "Dipendenze installate"

# Genera client Prisma
npm run prisma:generate
print_status "Client Prisma generati"

# Esegui migrazioni
echo -e "${YELLOW}Esecuzione migrazioni database...${NC}"
npx prisma migrate deploy
print_status "Migrazioni eseguite"

# Build
echo -e "${YELLOW}Build in corso (potrebbe richiedere qualche minuto)...${NC}"
npm run build
print_status "Build completato"

# ============================================
# 7. CONFIGURAZIONE PM2 (opzionale)
# ============================================
echo -e "\n${BLUE}[7/7] Configurazione PM2...${NC}"

read -p "Vuoi configurare PM2 per l'avvio automatico? [s/N]: " SETUP_PM2

if [[ "$SETUP_PM2" =~ ^[Ss]$ ]]; then
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    fi
    
    pm2 start npm --name "databasefdo" -- start
    pm2 save
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
    print_status "PM2 configurato"
else
    print_warning "PM2 non configurato. Avvia manualmente con: npm run start"
fi

# ============================================
# COMPLETATO
# ============================================
echo -e "\n${GREEN}"
echo "============================================"
echo "  ✅ Setup completato con successo!"
echo "============================================"
echo -e "${NC}"
echo ""
echo "📝 Riepilogo:"
echo "   - Database FDO: ${DB_NAME}"
echo "   - Database IARP: ${DB_IARP}"
echo "   - URL: ${APP_URL}"
echo ""
echo "🚀 Comandi utili:"
echo "   - Avviare: npm run start"
echo "   - Sviluppo: npm run dev"
echo "   - Prisma Studio: npm run prisma:studio"
echo ""
echo "🗑️  Per eliminare questo script:"
echo "   rm setup.sh"
echo ""

# Chiedi se eliminare lo script
read -p "Vuoi eliminare questo script di setup? [s/N]: " DELETE_SCRIPT

if [[ "$DELETE_SCRIPT" =~ ^[Ss]$ ]]; then
    rm -- "$0"
    echo -e "${GREEN}Script eliminato!${NC}"
fi
