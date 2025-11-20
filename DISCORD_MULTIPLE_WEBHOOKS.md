# 🔔 Configurazione Webhook Discord Multipli

## Panoramica
Il sistema FDO supporta **webhook multipli** per inviare notifiche a canali Discord diversi in base al tipo di evento:

- 🚨 **Arresti** → Canale `#arresti`
- 📝 **Denunce** → Canale `#denunce`
- 🔴 **Ricercati** → Canale `#ricercati`
- 🔫 **Licenze Armi** → Canale `#licenze-armi`
- 👮 **Operatori** → Canale `#operatori`

## 🎯 Vantaggi dei Webhook Multipli

✅ **Organizzazione**: Ogni tipo di notifica in un canale dedicato
✅ **Permessi Granulari**: Controlla chi vede cosa
✅ **Facilità di Ricerca**: Storico separato per categoria
✅ **Notifiche Mirate**: Menzioni (@role) diverse per ogni canale
✅ **Scalabilità**: Aggiungi o rimuovi canali facilmente

## 📋 Configurazione

### Opzione 1: Webhook Singolo (Semplice)
Se vuoi tutte le notifiche in un unico canale:

```env
# Nel file .env
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/123456789/abcdefgh..."
```

Tutte le notifiche andranno in questo canale.

### Opzione 2: Webhook Multipli (Raccomandato)
Per canali separati per ogni tipo di notifica:

#### Passo 1: Crea i Canali Discord

Sul tuo server Discord, crea questi canali (o usa nomi diversi):
- `#arresti`
- `#denunce`
- `#ricercati`
- `#licenze-armi`
- `#operatori`

#### Passo 2: Crea un Webhook per Ogni Canale

Per ogni canale:
1. Click destro sul canale
2. **Modifica Canale** → **Integrazioni** → **Webhook**
3. **Nuovo Webhook**
4. Personalizza nome e avatar
5. **Copia URL Webhook**

#### Passo 3: Configura il File .env

```env
# Webhook GENERALE (fallback)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/GENERAL_ID/TOKEN"

# Webhook SPECIFICI
DISCORD_WEBHOOK_ARRESTS="https://discord.com/api/webhooks/ARRESTS_ID/TOKEN"
DISCORD_WEBHOOK_REPORTS="https://discord.com/api/webhooks/REPORTS_ID/TOKEN"
DISCORD_WEBHOOK_WANTED="https://discord.com/api/webhooks/WANTED_ID/TOKEN"
DISCORD_WEBHOOK_WEAPONS="https://discord.com/api/webhooks/WEAPONS_ID/TOKEN"
DISCORD_WEBHOOK_OPERATORS="https://discord.com/api/webhooks/OPERATORS_ID/TOKEN"
```

#### Passo 4: Riavvia il Server

```bash
npm run dev
```

### Opzione 3: Configurazione Ibrida
Puoi configurare solo alcuni webhook specifici e lasciare gli altri usare quello generale:

```env
# Generale (per tutto)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/GENERAL_ID/TOKEN"

# Solo arresti in un canale separato
DISCORD_WEBHOOK_ARRESTS="https://discord.com/api/webhooks/ARRESTS_ID/TOKEN"

# Denunce e ricercati useranno il webhook generale
# DISCORD_WEBHOOK_REPORTS non configurato → usa DISCORD_WEBHOOK_URL
# DISCORD_WEBHOOK_WANTED non configurato → usa DISCORD_WEBHOOK_URL
```

## 🎨 Esempio Setup Completo

### Su Discord:

```
📁 CATEGORIA: SISTEMA FDO
  ├─ 🚨 arresti              (Webhook: ARRESTS)
  ├─ 📝 denunce              (Webhook: REPORTS)
  ├─ 🔴 ricercati            (Webhook: WANTED)
  ├─ 🔫 licenze-armi         (Webhook: WEAPONS)
  ├─ 👮 operatori            (Webhook: OPERATORS)
  └─ 📊 dashboard-generale   (Webhook: GENERAL)
```

### Nel File .env:

```env
# Database
DATABASE_URL="mysql://user:pass@localhost:3306/fdo"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Discord - Webhook Generale
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/111111111/aaaaaaa"

# Discord - Webhook Specifici
DISCORD_WEBHOOK_ARRESTS="https://discord.com/api/webhooks/222222222/bbbbbbb"
DISCORD_WEBHOOK_REPORTS="https://discord.com/api/webhooks/333333333/ccccccc"
DISCORD_WEBHOOK_WANTED="https://discord.com/api/webhooks/444444444/ddddddd"
DISCORD_WEBHOOK_WEAPONS="https://discord.com/api/webhooks/555555555/eeeeeee"
DISCORD_WEBHOOK_OPERATORS="https://discord.com/api/webhooks/666666666/fffffff"
```

## 🧪 Test

### Test Webhook Specifico

1. Vai su `http://localhost:3001/admin/discord-test`
2. Testa ogni tipo di notifica individualmente
3. Verifica che arrivino nei canali corretti

### Test Operativo

1. **Arresti**: Crea un nuovo arresto → Controlla `#arresti`
2. **Denunce**: Crea una nuova denuncia → Controlla `#denunce`
3. **Ricercati**: Aggiungi un ricercato → Controlla `#ricercati`
4. **Licenze**: Rilascia una licenza → Controlla `#licenze-armi`
5. **Operatori**: Registra un operatore → Controlla `#operatori`

## 🔍 Comportamento del Sistema

### Logica di Fallback

Il sistema usa questa priorità per ogni tipo:

```
1. Webhook Specifico (es. DISCORD_WEBHOOK_ARRESTS)
   ↓ (se non configurato)
2. Webhook Generale (DISCORD_WEBHOOK_URL)
   ↓ (se non configurato)
3. Nessuna notifica (log di warning)
```

**Esempio:**
- Se `DISCORD_WEBHOOK_ARRESTS` è configurato → Usa quello per gli arresti
- Se `DISCORD_WEBHOOK_ARRESTS` NON è configurato → Usa `DISCORD_WEBHOOK_URL`
- Se nessuno è configurato → Log: "⚠️ Discord Webhook (arrests) non configurato"

### Log di Debug

Nel console del server vedrai:
```
✅ Notifica Discord (arrests) inviata con successo
✅ Notifica Discord (reports) inviata con successo
⚠️ Discord Webhook (weapons) non configurato. Aggiungi DISCORD_WEBHOOK_WEAPONS...
```

## 🎨 Personalizzazione per Canale

Puoi personalizzare ogni webhook su Discord con:

- **Nome diverso**: Es. "Arresti FDO", "Denunce FDO", etc.
- **Avatar diverso**: Usa icone diverse per categoria
- **Menzioni**: Configura @role diversi in base al canale

### Esempio:
```
#arresti → Webhook "🚨 Arresti" → Menziona @polizia
#denunce → Webhook "📝 Denunce" → Menziona @investigatori
#ricercati → Webhook "🔴 Ricercati" → Menziona @everyone
```

## 🔒 Permessi per Canale

Puoi configurare permessi Discord diversi per ogni canale:

```
#arresti
  ✅ @Comandante: Vedi + Scrivi
  ✅ @Ufficiali: Vedi + Scrivi
  ❌ @Agenti: Solo lettura

#denunce
  ✅ @Tutti gli operatori: Vedi + Scrivi

#operatori
  ✅ @Admin: Vedi + Scrivi
  ❌ @Altri: Nascosto
```

## 📊 Monitoraggio

### Variabili Configurate

Controlla quali webhook sono configurati guardando i log all'avvio:

```bash
npm run dev
```

Nel console:
```
📡 Discord Webhooks Configurati:
  ✅ General: Sì
  ✅ Arrests: Sì (dedicato)
  ✅ Reports: No (usa general)
  ✅ Wanted: Sì (dedicato)
  ✅ Weapons: No (usa general)
  ✅ Operators: Sì (dedicato)
```

## ❓ FAQ

**Q: Devo configurare tutti i webhook?**
A: No! Puoi configurare solo quelli che vuoi. Gli altri useranno il webhook generale.

**Q: Posso avere tutti gli arresti E le denunce nello stesso canale?**
A: Sì! Usa lo stesso URL webhook per entrambi:
```env
DISCORD_WEBHOOK_ARRESTS="https://discord.com/api/webhooks/SAME/TOKEN"
DISCORD_WEBHOOK_REPORTS="https://discord.com/api/webhooks/SAME/TOKEN"
```

**Q: Cosa succede se elimino un webhook su Discord?**
A: Le notifiche per quel tipo falliranno con errore 404, ma il sistema continuerà a funzionare. Dovrai ricreare il webhook.

**Q: Posso cambiare webhook senza riavviare?**
A: No, devi riavviare il server dopo aver modificato il file `.env`.

**Q: Quanti webhook posso avere?**
A: Discord permette 10 webhook per canale. Puoi avere un numero illimitato di canali.

## 🚨 Risoluzione Problemi

| Problema | Soluzione |
|----------|-----------|
| Notifiche vanno nel canale sbagliato | Verifica gli URL dei webhook nel `.env` |
| Alcune notifiche non arrivano | Controlla che il webhook specifico o generale sia configurato |
| Errore 404 su webhook specifico | Webhook eliminato su Discord - ricrealo |
| Tutte le notifiche in un canale | È normale se non hai configurato i webhook specifici |

## 🎯 Best Practices

✅ **DO:**
- Usa webhook separati per categorie critiche (arresti, ricercati)
- Configura almeno il webhook generale come fallback
- Usa nomi descrittivi per i webhook su Discord
- Testa ogni webhook dopo la configurazione

❌ **DON'T:**
- Non condividere mai gli URL dei webhook pubblicamente
- Non usare lo stesso webhook per server Discord diversi
- Non dimenticare di configurare almeno `DISCORD_WEBHOOK_URL`

## 📚 Risorse

- [Documentazione Discord Webhooks](https://discord.com/developers/docs/resources/webhook)
- [DISCORD_INTEGRATION_SUMMARY.md](./DISCORD_INTEGRATION_SUMMARY.md)
- [.env.example](./.env.example)

---

**Sistema configurato!** 🎉 Ora hai il pieno controllo su dove vanno le notifiche Discord.
