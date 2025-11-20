# 🎉 Integrazione Webhook Discord - Completata!

## ✅ Cosa è stato fatto

### 1. **Servizio Webhook Centralizzato**
- ✅ Creato `src/lib/discord-webhook.ts` - Servizio principale per gestire tutte le notifiche Discord
- ✅ Supporto per 6 tipi di notifiche con colori diversi
- ✅ Gestione automatica degli errori (non blocca le operazioni se il webhook fallisce)
- ✅ Cache e ottimizzazione delle richieste

### 2. **Integrazioni API**
Webhook integrati in tutte le API principali:

| API | File | Notifica |
|-----|------|----------|
| Arresti | `src/app/api/arrests/route.ts` | 🚨 Notifica ROSSA con dettagli arresto |
| Denunce | `src/app/api/reports/route.ts` | 📝 Notifica ARANCIONE con dettagli denuncia |
| Ricercati | `src/app/api/wanted/route.ts` | 🔴 Notifica VIOLA con dettagli ricercato |
| Licenze Armi | `src/app/api/weapon-licenses/route.ts` | 🔫 Notifica ORO con dettagli licenza |
| Operatori | `src/app/api/users/route.ts` | 👮 Notifica VERDE con dettagli operatore |

### 3. **Sistema di Test**
- ✅ API endpoint `/api/discord/test` per testare le notifiche
- ✅ Pagina UI `/admin/discord-test` per testare dall'interfaccia web
- ✅ Test per connessione generale e notifiche specifiche

### 4. **Documentazione**
- ✅ `DISCORD_WEBHOOK_SETUP.md` - Guida completa alla configurazione
- ✅ `.env.example` - Template per le variabili d'ambiente
- ✅ Esempi di notifiche e risoluzione problemi

## 🔔 Tipi di Notifiche

### 🚨 Arresti (ROSSO - #E74C3C)
Quando viene registrato un nuovo arresto, viene inviata una notifica con:
- Nome dell'arrestato
- Agente responsabile e dipartimento
- Luogo dell'arresto
- Accuse complete
- Sanzioni (multa e/o sentenza se presenti)
- ID arresto

### 📝 Denunce (ARANCIONE - #E67E22)
Quando viene creata una nuova denuncia:
- Titolo e tipo della denuncia
- Denunciante (o "Anonimo")
- Accusato (se presente)
- Agente che ha preso la denuncia
- Luogo
- ID denuncia

### 🔴 Ricercati (VIOLA - #9B59B6)
Quando viene aggiunto un nuovo ricercato:
- Nome del ricercato
- Accuse
- Livello di gravità/pericolosità
- Agente responsabile
- Taglia (se presente)
- ID ricercato

### 🔫 Licenze Porto d'Armi (ORO - #F39C12)
Quando viene rilasciata una nuova licenza:
- Intestatario della licenza
- Tipo di licenza
- Chi l'ha rilasciata
- Data di scadenza
- ID licenza

### 👮 Nuovi Operatori (VERDE - #2ECC71)
Quando viene registrato un nuovo operatore:
- Nome e cognome
- Badge
- Dipartimento
- Grado
- ID operatore

## 🚀 Come Usare

### Passo 1: Crea il Webhook su Discord

1. Apri Discord e vai sul tuo server
2. Vai sul canale dove vuoi ricevere le notifiche (es. `#sistema-fdo`)
3. Click destro sul canale → **Modifica Canale**
4. Vai su **Integrazioni** → **Webhook**
5. Click su **Nuovo Webhook**
6. Personalizza:
   - Nome: `Sistema FDO`
   - Avatar: (opzionale)
7. **Copia URL Webhook**

### Passo 2: Configura l'Applicazione

1. Apri il file `.env` nella root del progetto
2. Aggiungi questa riga:
```env
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/123456789/abcdefgh..."
```
3. Salva il file

### Passo 3: Riavvia il Server

```bash
npm run dev
```

### Passo 4: Testa l'Integrazione

**Opzione A: Test dall'Interfaccia Web**
1. Vai su `http://localhost:3001/admin/discord-test`
2. Click su "Testa Connessione Webhook"
3. Controlla il canale Discord per la notifica

**Opzione B: Test via API**
```bash
curl http://localhost:3001/api/discord/test
```

**Opzione C: Test Operativo**
1. Crea un nuovo arresto dal sistema
2. Controlla Discord per la notifica automatica

## 📊 Esempi di Notifiche

### Esempio: Notifica Arresto
```
🚨 NUOVO ARRESTO REGISTRATO
È stato effettuato un nuovo arresto nel sistema.

👤 Arrestato: Mario Rossi
👮 Agente: Giuseppe Verdi
🏢 Dipartimento: Polizia di Stato
📍 Luogo: Via Roma, 123
⚖️ Accuse: Rapina a mano armata, Resistenza all'arresto
⚖️ Sanzioni: 🕐 8 anni • 💰 €10,000

ID Arresto: #1234 • Sistema FDO
```

### Esempio: Notifica Denuncia
```
📝 NUOVA DENUNCIA REGISTRATA
Furto in appartamento

📋 Tipo: furto
👮 Agente: Luigi Bianchi
📍 Luogo: Piazza Garibaldi, 45
👤 Denunciante: Anna Neri
⚠️ Accusato: Carlo Gialli

ID Denuncia: #5678 • Sistema FDO
```

## ⚙️ Personalizzazione

### Cambiare i Colori
Modifica `src/lib/discord-webhook.ts`:
```typescript
export const DiscordColors = {
  RED: 0xE74C3C,      // Il tuo colore per arresti
  ORANGE: 0xE67E22,   // Il tuo colore per denunce
  // ... etc
};
```

### Cambiare Nome/Avatar del Bot
Nel costruttore di `DiscordWebhookService`:
```typescript
constructor() {
  this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  this.botName = "Il Tuo Nome Bot";
  this.botAvatar = "https://url-immagine.png";
}
```

### Disabilitare Temporaneamente
Commenta la variabile nel `.env`:
```env
# DISCORD_WEBHOOK_URL="https://..."
```

## 🔧 Risoluzione Problemi

| Problema | Soluzione |
|----------|-----------|
| ⚠️ "Webhook non configurato" | Aggiungi `DISCORD_WEBHOOK_URL` al `.env` |
| ❌ Errore 404 | Webhook eliminato o URL non valido - ricrealo |
| ❌ Errore 401 | Token scaduto - genera nuovo webhook |
| Notifiche non arrivano | Controlla permessi del webhook sul canale |
| Rate limit | Discord limita a 30 msg/min - rallenta le operazioni |

## 📝 Note Importanti

⚠️ **Sicurezza**:
- Non condividere mai l'URL del webhook pubblicamente
- Non committare il file `.env` su Git
- Usa canali privati per dati sensibili

✅ **Funzionalità**:
- Le notifiche sono **non bloccanti** - se falliscono, l'operazione continua
- Supporta **retry automatico** in caso di errori temporanei
- **Rate limiting** gestito automaticamente da Discord

## 🎯 Prossimi Sviluppi Possibili

- [ ] Notifiche per avvistamenti ricercati
- [ ] Notifiche per modifiche/eliminazioni
- [ ] Supporto per più webhook (canali diversi per tipo)
- [ ] Dashboard statistiche notifiche inviate
- [ ] Integrazione con altri servizi (Telegram, Slack, etc.)

## 📚 Risorse

- [Documentazione Discord Webhooks](https://discord.com/developers/docs/resources/webhook)
- [DISCORD_WEBHOOK_SETUP.md](./DISCORD_WEBHOOK_SETUP.md) - Guida completa
- [.env.example](./.env.example) - Template configurazione

---

**Fatto!** 🎉 Il sistema è ora completamente integrato con Discord e pronto per inviare notifiche in tempo reale.
