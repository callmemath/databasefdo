require('dotenv').config();

module.exports = {
  apps: [{
    name: 'databasefdo',
    script: 'npm',
    args: 'start',
    cwd: '/IARP/databasefdo',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      // Legge automaticamente dal file .env
      DATABASE_URL: process.env.DATABASE_URL,
      DATABASE_URL_IARP: process.env.DATABASE_URL_IARP,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      DISCORD_BOT_API_TOKEN: process.env.DISCORD_BOT_API_TOKEN,
      DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
      DISCORD_WEBHOOK_ARRESTS: process.env.DISCORD_WEBHOOK_ARRESTS,
      DISCORD_WEBHOOK_REPORTS: process.env.DISCORD_WEBHOOK_REPORTS,
      DISCORD_WEBHOOK_WANTED: process.env.DISCORD_WEBHOOK_WANTED,
      DISCORD_WEBHOOK_WEAPONS: process.env.DISCORD_WEBHOOK_WEAPONS,
      DISCORD_WEBHOOK_OPERATORS: process.env.DISCORD_WEBHOOK_OPERATORS
    }
  }]
};
