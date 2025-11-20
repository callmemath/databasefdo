# 🚔 Sistema FDO - Database Forze dell'Ordine

Sistema completo di gestione per le Forze dell'Ordine con funzionalità di gestione utenti, arresti, denunce, ricercati, licenze armi e integrazione Discord.

![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC)

## 📋 Caratteristiche

### 🔐 Autenticazione e Gestione Utenti
- Sistema di login sicuro con NextAuth.js
- Gestione profili operatori con badge e dipartimenti
- Sistema di permessi e ruoli

### 📝 Gestione Database
- **Arresti**: Registrazione e gestione arresti con sanzioni
- **Denunce**: Sistema completo di gestione denunce
- **Ricercati**: Database ricercati con avvistamenti
- **Licenze Armi**: Gestione licenze porto d'armi
- **Cittadini**: Anagrafica cittadini completa

### 🤖 Integrazione Discord
- Notifiche automatiche su Discord per ogni operazione
- Bot Discord per gestione utenti via comandi slash
- API dedicate per il bot Discord

### 📊 Dashboard e Statistiche
- Dashboard completa con statistiche in tempo reale
- Visualizzazione dati aggregati
- Grafici e analisi

## 🚀 Quick Start

### 1️⃣ Prerequisiti

- **Node.js** 18+ 
- **npm** o **yarn**
- **Database** PostgreSQL o MySQL
- **Git**

### 2️⃣ Installazione

```bash
# Clona il repository
git clone https://github.com/tuo-username/databasefdo.git
cd databasefdo

# Installa le dipendenze
npm install

# Copia il file di esempio delle variabili d'ambiente
cp .env.example .env
```

### 3️⃣ Configurazione Database

Modifica il file `.env` con i tuoi dati:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fdo_database"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-secret-sicuro"
```

### 4️⃣ Setup Database

```bash
# Esegui le migrazioni Prisma
npx prisma migrate deploy

# Genera il client Prisma
npx prisma generate

# (Opzionale) Popola il database con dati di test
npm run seed
```

### 5️⃣ Avvia l'applicazione

```bash
# Sviluppo
npm run dev

# Produzione
npm run build
npm run start
```

L'applicazione sarà disponibile su `http://localhost:3000`

## 🔧 Configurazione

### Variabili d'Ambiente Richieste

```env
# Database (OBBLIGATORIO)
DATABASE_URL="postgresql://..."

# NextAuth (OBBLIGATORIO)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Discord Webhook (OPZIONALE)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# Discord Bot API (OPZIONALE)
DISCORD_BOT_API_TOKEN="your-token-here"

# Admin API (OPZIONALE)
ADMIN_API_SECRET="your-secret-here"
```

### Generare NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## 📚 Documentazione

- [Configurazione Discord Webhook](./DISCORD_WEBHOOK_SETUP.md)
- [Integrazione Discord Multiple Webhooks](./DISCORD_MULTIPLE_WEBHOOKS.md)
- [Sommario Integrazione Discord](./DISCORD_INTEGRATION_SUMMARY.md)
- [Ottimizzazioni Performance](./PERFORMANCE_OPTIMIZATION.md)
- [Bot Discord Python](./discord_bot_example/README.md)

## 🤖 Discord Bot

Il progetto include un bot Discord (Python) per gestire utenti tramite comandi slash.

```bash
cd discord_bot_example
pip install -r requirements.txt
cp .env.example .env
# Configura .env
python main.py
```

**Comandi disponibili:**
- `/fdo-crea-utente` - Crea nuovo operatore
- `/fdo-lista-utenti` - Lista operatori
- `/fdo-info-utente` - Info operatore
- `/fdo-modifica-utente` - Modifica operatore
- `/fdo-elimina-utente` - Elimina operatore

## 🏗️ Struttura Progetto

```
databasefdo/
├── src/
│   ├── app/              # Pages e API routes
│   ├── components/       # Componenti React
│   ├── lib/             # Utilities e configurazioni
│   └── types/           # TypeScript types
├── prisma/
│   ├── schema.prisma    # Schema database
│   └── migrations/      # Migrazioni database
├── discord_bot_example/ # Bot Discord Python
└── public/              # Assets statici
```

## 🚀 Deploy

### Deploy su Windows Server VPS

```bash
# Clona il repository sul server
git clone https://github.com/tuo-username/databasefdo.git
cd databasefdo

# Installa dipendenze
npm install

# Build produzione
npm run build

# Avvia con PM2 (consigliato)
npm install -g pm2
pm2 start npm --name "fdo-system" -- start
pm2 save
pm2 startup
```

### Deploy su Vercel (Cloud)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tuo-username/databasefdo)

1. Connetti il repository GitHub
2. Configura le variabili d'ambiente
3. Deploy automatico!

## 🔒 Sicurezza

⚠️ **IMPORTANTE:**
- Non committare mai il file `.env`
- Usa password forti per il database
- Cambia `NEXTAUTH_SECRET` in produzione
- Limita l'accesso alle API solo a IP autorizzati
- Abilita HTTPS in produzione

## 🛠️ Tecnologie Utilizzate

- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: TailwindCSS
- **UI Components**: Custom components
- **Icons**: Lucide React
- **API**: REST API
- **Discord Integration**: Webhooks + Bot

## 📝 Scripts Disponibili

```bash
npm run dev          # Avvia in sviluppo
npm run build        # Build produzione
npm run start        # Avvia produzione
npm run lint         # Linting codice
```

## 🐛 Troubleshooting

### Errore "Module not found"
```bash
npm install
npx prisma generate
```

### Errore database connection
- Verifica `DATABASE_URL` nel `.env`
- Controlla che il database sia in esecuzione
- Verifica credenziali database

### Build fallita
```bash
# Pulisci cache
rm -rf .next node_modules
npm install
npm run build
```

## 📄 Licenza

Questo progetto è proprietario. Tutti i diritti riservati.

## 👥 Autori

- Il tuo nome/team

## 🙏 Supporto

Per supporto o domande:
- Apri una issue su GitHub
- Contatta: tua-email@example.com

---

**Made with ❤️ for FDO**

