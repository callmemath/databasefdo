# 🔔 Guida Integrazione Webhook Discord

## Panoramica
Il sistema FDO invia automaticamente notifiche a Discord quando vengono create nuove entità nel database:

- 🚨 **Arresti** - Quando viene registrato un nuovo arresto
- 📝 **Denunce** - Quando viene creata una nuova denuncia
- 🔴 **Ricercati** - Quando viene aggiunto un nuovo ricercato
- 👁️ **Avvistamenti** - Quando viene segnalato un avvistamento di un ricercato
- 🔫 **Licenze Armi** - Quando viene rilasciata una nuova licenza porto d'armi
- 👮 **Operatori** - Quando viene registrato un nuovo operatore

## Configurazione

### 1. Crea un Webhook su Discord

1. Apri Discord e vai sul tuo server
2. Fai clic destro sul canale dove vuoi ricevere le notifiche (es. `#sistema-fdo`)
3. Seleziona **Modifica Canale** (o **Edit Channel**)
4. Vai su **Integrazioni** > **Webhook**
5. Clicca su **Nuovo Webhook** (o **Create Webhook**)
6. Personalizza il webhook:
   - Nome: `Sistema FDO` (o quello che preferisci)
   - Avatar: Carica un'immagine (opzionale)
7. Clicca su **Copia URL Webhook**

### 2. Configura il Webhook nell'Applicazione

1. Apri il file `.env` nella root del progetto
2. Aggiungi la variabile `DISCORD_WEBHOOK_URL`:

```env
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/123456789/abcdefghijklmnopqrstuvwxyz"
```

3. Salva il file

### 3. Riavvia il Server

```bash
npm run dev
```

## Tipi di Notifiche

### 🚨 Arresti
Invia una notifica **ROSSA** quando viene registrato un nuovo arresto con:
- Nome dell'arrestato
- Agente responsabile
- Dipartimento
- Luogo dell'arresto
- Accuse
- Sanzioni (multa e/o sentenza)

### 📝 Denunce
Invia una notifica **ARANCIONE** quando viene creata una nuova denuncia con:
- Titolo della denuncia
- Tipo di reato
- Denunciante (o "Anonimo")
- Accusato (se presente)
- Agente che ha preso la denuncia
- Luogo

### 🔴 Ricercati
Invia una notifica **VIOLA** quando viene aggiunto un nuovo ricercato con:
- Nome del ricercato
- Accuse
- Livello di pericolosità
- Agente responsabile
- Taglia (se presente)

### 👁️ Avvistamenti Ricercati
Invia una notifica **GIALLA** quando viene segnalato un avvistamento con:
- Nome del ricercato
- Località dell'avvistamento
- Descrizione dell'avvistamento
- Chi ha segnalato

### 🔫 Licenze Porto d'Armi
Invia una notifica **ORO** quando viene rilasciata una nuova licenza con:
- Intestatario
- Tipo di licenza
- Chi l'ha rilasciata
- Data di scadenza

### 👮 Nuovi Operatori
Invia una notifica **VERDE** quando viene registrato un nuovo operatore con:
- Nome e cognome
- Badge
- Dipartimento
- Grado

## Personalizzazione

### Cambiare i Colori delle Notifiche

Modifica il file `src/lib/discord-webhook.ts` e cambia i valori in `DiscordColors`:

```typescript
export const DiscordColors = {
  RED: 0xE74C3C,      // Arresti
  ORANGE: 0xE67E22,   // Denunce
  PURPLE: 0x9B59B6,   // Ricercati
  YELLOW: 0xF1C40F,   // Avvisi
  GREEN: 0x2ECC71,    // Operazioni completate
  GOLD: 0xF39C12,     // Licenze armi
};
```

### Cambiare Nome e Avatar del Bot

Nel costruttore della classe `DiscordWebhookService`:

```typescript
constructor() {
  this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  this.botName = "Il Tuo Nome Bot";
  this.botAvatar = "https://url-della-tua-immagine.png";
}
```

### Disabilitare le Notifiche Temporaneamente

Rimuovi o commenta la variabile `DISCORD_WEBHOOK_URL` nel file `.env`:

```env
# DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

Le notifiche verranno saltate automaticamente senza bloccare le operazioni.

## Test

### Testare le Notifiche

1. Crea un nuovo arresto, denuncia, o altro dal sistema
2. Controlla il canale Discord configurato
3. Dovresti vedere una notifica embed con tutti i dettagli

### Debug

Se le notifiche non funzionano, controlla:

1. **Console del Server**: Cerca messaggi di errore che iniziano con `❌`
2. **URL del Webhook**: Assicurati che sia corretto e non scaduto
3. **Permessi del Webhook**: Il webhook deve avere permessi di scrittura sul canale
4. **Formato dell'URL**: Deve iniziare con `https://discord.com/api/webhooks/`

## Esempi di Notifiche

### Esempio Arresto
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

### Esempio Denuncia
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

## Risoluzione Problemi

### "⚠️ Discord Webhook non configurato"
- Aggiungi `DISCORD_WEBHOOK_URL` al file `.env`
- Riavvia il server

### "❌ Errore invio webhook Discord: 404"
- L'URL del webhook non è valido o è stato eliminato
- Crea un nuovo webhook su Discord

### "❌ Errore invio webhook Discord: 401"
- Il token del webhook è scaduto o non valido
- Genera un nuovo webhook URL

### Le notifiche non arrivano ma non ci sono errori
- Controlla che il canale Discord esista ancora
- Verifica i permessi del webhook
- Controlla il rate limit di Discord (massimo 30 messaggi/minuto per webhook)

## Limitazioni Discord

- **Rate Limit**: Massimo 30 messaggi al minuto per webhook
- **Dimensione Messaggio**: Massimo 2000 caratteri per messaggio
- **Embed**: Massimo 10 embed per messaggio, 6000 caratteri totali per tutti gli embed
- **Timeout**: Le richieste devono completare entro 3 secondi

Il sistema gestisce automaticamente gli errori senza bloccare le operazioni principali.

## Sicurezza

⚠️ **IMPORTANTE**: 
- Non condividere mai l'URL del webhook pubblicamente
- Non committare il file `.env` nel repository Git
- Rigenera il webhook se pensi che sia stato compromesso
- Usa canali privati per le notifiche sensibili

## Supporto

Per problemi o domande:
1. Controlla i log del server
2. Verifica la configurazione del webhook su Discord
3. Consulta la documentazione Discord: https://discord.com/developers/docs/resources/webhook
