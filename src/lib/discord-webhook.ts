// Discord Webhook Service
// Servizio centralizzato per inviare notifiche a Discord

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
  thumbnail?: {
    url: string;
  };
}

interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

// Colori Discord (in formato decimale)
export const DiscordColors = {
  RED: 0xE74C3C,        // Per arresti
  ORANGE: 0xE67E22,     // Per denunce
  YELLOW: 0xF1C40F,     // Per avvisi
  GREEN: 0x2ECC71,      // Per operazioni completate
  BLUE: 0x3498DB,       // Per informazioni
  PURPLE: 0x9B59B6,     // Per ricercati
  GOLD: 0xF39C12,       // Per licenze armi
  DARK_RED: 0x992D22,   // Per emergenze
};

class DiscordWebhookService {
  // Webhook URLs separati per ogni tipo di notifica
  private webhookUrls: {
    arrests?: string;      // Per arresti
    reports?: string;      // Per denunce
    wanted?: string;       // Per ricercati
    weapons?: string;      // Per licenze armi
    operators?: string;    // Per operatori
    general?: string;      // Webhook generale (fallback)
  };
  
  private botName: string = "Sistema FDO";
  private botAvatar: string = "https://i.imgur.com/4M34hi2.png"; // Puoi personalizzare

  constructor() {
    // Carica i webhook specifici o usa quello generale come fallback
    this.webhookUrls = {
      arrests: process.env.DISCORD_WEBHOOK_ARRESTS || process.env.DISCORD_WEBHOOK_URL,
      reports: process.env.DISCORD_WEBHOOK_REPORTS || process.env.DISCORD_WEBHOOK_URL,
      wanted: process.env.DISCORD_WEBHOOK_WANTED || process.env.DISCORD_WEBHOOK_URL,
      weapons: process.env.DISCORD_WEBHOOK_WEAPONS || process.env.DISCORD_WEBHOOK_URL,
      operators: process.env.DISCORD_WEBHOOK_OPERATORS || process.env.DISCORD_WEBHOOK_URL,
      general: process.env.DISCORD_WEBHOOK_URL,
    };
  }

  /**
   * Verifica se un webhook specifico è configurato
   */
  isConfigured(type?: 'arrests' | 'reports' | 'wanted' | 'weapons' | 'operators' | 'general'): boolean {
    if (!type) {
      // Verifica se almeno un webhook è configurato
      return Object.values(this.webhookUrls).some(url => !!url && url.length > 0);
    }
    
    const url = this.webhookUrls[type];
    return !!url && url.length > 0;
  }

  /**
   * Ottiene l'URL del webhook per un tipo specifico
   */
  private getWebhookUrl(type: 'arrests' | 'reports' | 'wanted' | 'weapons' | 'operators' | 'general'): string | undefined {
    return this.webhookUrls[type] || this.webhookUrls.general;
  }

  /**
   * Invia un messaggio generico al webhook Discord
   */
  private async sendWebhook(
    payload: DiscordWebhookPayload, 
    webhookType: 'arrests' | 'reports' | 'wanted' | 'weapons' | 'operators' | 'general' = 'general'
  ): Promise<boolean> {
    const webhookUrl = this.getWebhookUrl(webhookType);
    
    if (!webhookUrl) {
      console.warn(`⚠️ Discord Webhook (${webhookType}) non configurato. Aggiungi DISCORD_WEBHOOK_${webhookType.toUpperCase()} o DISCORD_WEBHOOK_URL al file .env`);
      return false;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.botName,
          avatar_url: this.botAvatar,
          ...payload,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Errore invio webhook Discord (${webhookType}): ${response.status} - ${errorText}`);
        return false;
      }

      console.log(`✅ Notifica Discord (${webhookType}) inviata con successo`);
      return true;
    } catch (error) {
      console.error(`❌ Errore durante l'invio del webhook Discord (${webhookType}):`, error);
      return false;
    }
  }

  /**
   * Notifica per nuovo arresto
   */
  async notifyNewArrest(data: {
    arrestId: number;
    citizenName: string;
    charges: string;
    location: string;
    officerName: string;
    department: string;
    sentence?: string;
    fine?: number;
    description?: string;
    incidentDescription?: string;
    seizedItems?: string;
    accomplices?: Array<{ id: number; name: string }>;
    signingOfficers?: Array<{ id: number; name: string; badge?: string }>;
    date?: Date;
  }): Promise<boolean> {
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      {
        name: '👤 Arrestato',
        value: data.citizenName,
        inline: true,
      },
      {
        name: '👮 Agente',
        value: data.officerName,
        inline: true,
      },
      {
        name: '🏢 Dipartimento',
        value: data.department,
        inline: true,
      },
      {
        name: '📍 Luogo',
        value: data.location,
        inline: true,
      },
      {
        name: '📅 Data/Ora',
        value: data.date 
          ? data.date.toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : new Date().toLocaleString('it-IT'),
        inline: true,
      },
      {
        name: '⚖️ Accuse',
        value: data.charges,
        inline: false,
      },
    ];

    // Descrizione accaduti
    if (data.incidentDescription) {
      fields.push({
        name: '📝 Descrizione Accaduti',
        value: data.incidentDescription.length > 1024 
          ? data.incidentDescription.substring(0, 1021) + '...' 
          : data.incidentDescription,
        inline: false,
      });
    }

    // Sanzioni
    const sanctions: string[] = [];
    if (data.sentence) sanctions.push(`🕐 ${data.sentence}`);
    if (data.fine) sanctions.push(`💰 €${data.fine.toLocaleString()}`);
    
    if (sanctions.length > 0) {
      fields.push({
        name: '⚖️ Sanzioni',
        value: sanctions.join(' • '),
        inline: false,
      });
    }

    // Oggetti sequestrati
    if (data.seizedItems && data.seizedItems.trim().length > 0) {
      fields.push({
        name: '📦 Oggetti Sequestrati',
        value: data.seizedItems.length > 1024 
          ? data.seizedItems.substring(0, 1021) + '...' 
          : data.seizedItems,
        inline: false,
      });
    }

    // Complici
    if (data.accomplices && data.accomplices.length > 0) {
      const accompliceNames = data.accomplices
        .map(acc => `• ${acc.name}`)
        .join('\n');
      fields.push({
        name: `👥 Complici (${data.accomplices.length})`,
        value: accompliceNames.length > 1024 
          ? accompliceNames.substring(0, 1021) + '...' 
          : accompliceNames,
        inline: false,
      });
    }

    // Operatori firmatari
    if (data.signingOfficers && data.signingOfficers.length > 0) {
      const officerNames = data.signingOfficers
        .map(off => `• ${off.name}${off.badge ? ` (Badge: ${off.badge})` : ''}`)
        .join('\n');
      fields.push({
        name: `✍️ Operatori Firmatari (${data.signingOfficers.length})`,
        value: officerNames.length > 1024 
          ? officerNames.substring(0, 1021) + '...' 
          : officerNames,
        inline: false,
      });
    }

    // Note aggiuntive
    if (data.description && data.description.trim() !== 'Nessuna nota aggiuntiva') {
      fields.push({
        name: '📄 Note Aggiuntive',
        value: data.description.length > 1024 
          ? data.description.substring(0, 1021) + '...' 
          : data.description,
        inline: false,
      });
    }

    const embed: DiscordEmbed = {
      title: '🚨 NUOVO ARRESTO REGISTRATO',
      description: `È stato effettuato un nuovo arresto nel sistema.`,
      color: DiscordColors.RED,
      fields,
      footer: {
        text: `ID Arresto: #${data.arrestId} • Sistema FDO`,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({ embeds: [embed] }, 'arrests');
  }

  /**
   * Notifica per nuova denuncia
   */
  async notifyNewReport(data: {
    reportId: number;
    title: string;
    type: string;
    location: string;
    citizenName?: string;
    accusedName?: string;
    officerName: string;
    isAnonymous: boolean;
  }): Promise<boolean> {
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      {
        name: '📋 Tipo',
        value: data.type,
        inline: true,
      },
      {
        name: '👮 Agente',
        value: data.officerName,
        inline: true,
      },
      {
        name: '📍 Luogo',
        value: data.location,
        inline: true,
      },
    ];

    if (data.isAnonymous) {
      fields.push({
        name: '🔒 Denunciante',
        value: '**Anonimo**',
        inline: true,
      });
    } else if (data.citizenName) {
      fields.push({
        name: '👤 Denunciante',
        value: data.citizenName,
        inline: true,
      });
    }

    if (data.accusedName) {
      fields.push({
        name: '⚠️ Accusato',
        value: data.accusedName,
        inline: true,
      });
    }

    const embed: DiscordEmbed = {
      title: '📝 NUOVA DENUNCIA REGISTRATA',
      description: `**${data.title}**`,
      color: DiscordColors.ORANGE,
      fields,
      footer: {
        text: `ID Denuncia: #${data.reportId} • Sistema FDO`,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({ embeds: [embed] }, 'reports');
  }

  /**
   * Notifica per nuovo ricercato
   */
  async notifyNewWanted(data: {
    wantedId: number;
    citizenName: string;
    charges: string;
    severity: string;
    officerName: string;
    reward?: number;
  }): Promise<boolean> {
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      {
        name: '👤 Ricercato',
        value: data.citizenName,
        inline: true,
      },
      {
        name: '⚠️ Gravità',
        value: data.severity,
        inline: true,
      },
      {
        name: '👮 Agente',
        value: data.officerName,
        inline: true,
      },
      {
        name: '⚖️ Accuse',
        value: data.charges,
        inline: false,
      },
    ];

    if (data.reward && data.reward > 0) {
      fields.push({
        name: '💰 Taglia',
        value: `€${data.reward.toLocaleString()}`,
        inline: true,
      });
    }

    const embed: DiscordEmbed = {
      title: '🔴 NUOVO RICERCATO',
      description: `⚠️ **ATTENZIONE** - È stato emesso un nuovo mandato di ricerca.`,
      color: DiscordColors.PURPLE,
      fields,
      footer: {
        text: `ID Ricercato: #${data.wantedId} • Sistema FDO`,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({ embeds: [embed] }, 'wanted');
  }

  /**
   * Notifica per avvistamento ricercato
   */
  async notifyWantedSighting(data: {
    wantedId: number;
    citizenName: string;
    location: string;
    description: string;
    reportedBy: string;
  }): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: '👁️ AVVISTAMENTO RICERCATO',
      description: `È stato segnalato un avvistamento di **${data.citizenName}**`,
      color: DiscordColors.YELLOW,
      fields: [
        {
          name: '📍 Località',
          value: data.location,
          inline: true,
        },
        {
          name: '👮 Segnalato da',
          value: data.reportedBy,
          inline: true,
        },
        {
          name: '📝 Descrizione',
          value: data.description,
          inline: false,
        },
      ],
      footer: {
        text: `ID Ricercato: #${data.wantedId} • Sistema FDO`,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({ embeds: [embed] }, 'wanted');
  }

  /**
   * Notifica per nuova licenza porto d'armi
   */
  async notifyNewWeaponLicense(data: {
    licenseId: number;
    citizenName: string;
    type: string;
    validUntil: Date;
    issuedBy: string;
  }): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: '🔫 NUOVA LICENZA PORTO D\'ARMI',
      description: `È stata rilasciata una nuova licenza porto d'armi.`,
      color: DiscordColors.GOLD,
      fields: [
        {
          name: '👤 Intestatario',
          value: data.citizenName,
          inline: true,
        },
        {
          name: '📜 Tipo Licenza',
          value: data.type,
          inline: true,
        },
        {
          name: '👮 Rilasciata da',
          value: data.issuedBy,
          inline: true,
        },
        {
          name: '📅 Valida fino al',
          value: data.validUntil.toLocaleDateString('it-IT'),
          inline: true,
        },
      ],
      footer: {
        text: `ID Licenza: #${data.licenseId} • Sistema FDO`,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({ embeds: [embed] }, 'weapons');
  }

  /**
   * Notifica per nuovo operatore registrato
   */
  async notifyNewOperator(data: {
    operatorId: number;
    name: string;
    surname: string;
    badge: string;
    department: string;
    rank: string;
  }): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: '👮 NUOVO OPERATORE REGISTRATO',
      description: `Un nuovo operatore è stato aggiunto al sistema.`,
      color: DiscordColors.GREEN,
      fields: [
        {
          name: '👤 Nome',
          value: `${data.name} ${data.surname}`,
          inline: true,
        },
        {
          name: '🎖️ Badge',
          value: data.badge,
          inline: true,
        },
        {
          name: '🏢 Dipartimento',
          value: data.department,
          inline: true,
        },
        {
          name: '⭐ Grado',
          value: data.rank,
          inline: true,
        },
      ],
      footer: {
        text: `ID Operatore: #${data.operatorId} • Sistema FDO`,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({ embeds: [embed] }, 'operators');
  }

  /**
   * Notifica generica per operazioni di sistema
   */
  async notifySystemEvent(data: {
    title: string;
    description: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  }): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: data.title,
      description: data.description,
      color: data.color || DiscordColors.BLUE,
      fields: data.fields || [],
      footer: {
        text: 'Sistema FDO',
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendWebhook({ embeds: [embed] }, 'general');
  }
}

// Esporta un'istanza singleton
export const discordWebhook = new DiscordWebhookService();
