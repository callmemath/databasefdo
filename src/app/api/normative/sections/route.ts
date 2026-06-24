import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export interface NormativeTopic {
  title: string;
  /** Topic content as XML string matching the <doc> schema defined in src/lib/normative-xml.ts */
  content: string;
}

export interface NormativeSectionData {
  title: string;
  topics: NormativeTopic[];
}

export type NormativeSectionsData = Record<string, NormativeSectionData>;

const SETTING_KEY = 'normative_static_sections';

const DEFAULT_SECTIONS: NormativeSectionsData = {
  'codici-radio': {
    title: 'Codici Radio',
    topics: [
      {
        title: 'Codici di Emergenza',
        content: `<doc>
  <heading>Codici Radio di Emergenza</heading>
  <para>I seguenti codici sono utilizzati nelle comunicazioni radio per indicare situazioni di emergenza:</para>
  <entries>
    <entry name="Codice 0">Emergenza massima, agente in pericolo di vita.</entry>
    <entry name="Codice 1">Richiesta di supporto urgente, situazione critica.</entry>
    <entry name="Codice 2">Rispondere rapidamente, ma senza sirene o luci.</entry>
    <entry name="Codice 3">Rispondere con sirene e luci, emergenza.</entry>
  </entries>
</doc>`,
      },
      {
        title: 'Codici di Situazione',
        content: `<doc>
  <heading>Codici di Situazione</heading>
  <para>Utilizzare questi codici per comunicare lo stato delle situazioni:</para>
  <entries>
    <entry name="Codice 4">Situazione sotto controllo, non è richiesto ulteriore supporto.</entry>
    <entry name="Codice 5">Arresto in corso, richiesta di supporto per trasporto.</entry>
    <entry name="Codice 6">Indagine in corso, rimanere in attesa di istruzioni.</entry>
    <entry name="Codice 7">Pausa pranzo/cena, agente temporaneamente non disponibile.</entry>
  </entries>
</doc>`,
      },
      {
        title: 'Codici Operativi',
        content: `<doc>
  <heading>Codici Operativi</heading>
  <para>Questi codici sono utilizzati per le operazioni quotidiane:</para>
  <entries>
    <entry name="Codice 10">In servizio, disponibile per chiamate.</entry>
    <entry name="Codice 11">Fermo veicolo in corso, controllo documenti.</entry>
    <entry name="Codice 12">Richiesta informazioni su targa o individuo.</entry>
    <entry name="Codice 13">Richiesta assistenza sanitaria.</entry>
  </entries>
</doc>`,
      },
    ],
  },
  'procedure-operative': {
    title: 'Procedure Operative',
    topics: [
      {
        title: 'Procedure di Arresto',
        content: `<doc>
  <heading>Procedure Standard di Arresto</heading>
  <para>Le seguenti procedure devono essere seguite durante un arresto:</para>
  <steps>
    <step title="1. Identificazione e Valutazione">
      <item>Identificare il sospetto e verificare eventuali mandati esistenti</item>
      <item>Valutare la situazione per determinare il livello di rischio</item>
      <item>Richiedere rinforzi se necessario prima di procedere</item>
    </step>
    <step title="2. Approccio e Comunicazione">
      <item>Identificarsi chiaramente come agente di polizia</item>
      <item>Informare il sospetto del motivo dell&apos;arresto</item>
      <item>Utilizzare comandi chiari e diretti</item>
      <item>Mantenere una distanza di sicurezza appropriata</item>
    </step>
    <step title="3. Contenimento e Ammanettamento">
      <item>Utilizzare la forza minima necessaria per effettuare l&apos;arresto</item>
      <item>Posizionare le manette con le mani dietro la schiena quando possibile</item>
      <item>Verificare che le manette non siano troppo strette</item>
      <item>Perquisire il sospetto per eventuali armi o prove</item>
    </step>
    <step title="4. Trasporto e Registrazione">
      <item>Trasportare il sospetto al dipartimento di polizia</item>
      <item>Leggere i diritti al sospetto durante il trasporto</item>
      <item>Documentare tutte le fasi dell&apos;arresto</item>
      <item>Registrare l&apos;arresto nel sistema FDO</item>
    </step>
  </steps>
</doc>`,
      },
      {
        title: 'Gestione delle Scene del Crimine',
        content: `<doc>
  <heading>Procedure per la Gestione delle Scene del Crimine</heading>
  <para>Le seguenti linee guida devono essere seguite durante l&apos;intervento su una scena del crimine:</para>
  <steps>
    <step title="1. Arrivo sulla Scena">
      <item>Valutare la sicurezza dell&apos;area e dei presenti</item>
      <item>Prestare primo soccorso a eventuali feriti</item>
      <item>Chiamare rinforzi e servizi medici se necessario</item>
      <item>Stabilire un perimetro di sicurezza</item>
    </step>
    <step title="2. Protezione della Scena">
      <item>Delimitare l&apos;area con nastro segnaletico</item>
      <item>Registrare i nomi di tutte le persone presenti all&apos;arrivo</item>
      <item>Allontanare i non addetti ai lavori</item>
      <item>Proteggere le prove da contaminazione e agenti atmosferici</item>
    </step>
  </steps>
</doc>`,
      },
    ],
  },
  'codice-stradale': {
    title: 'Codice Stradale',
    topics: [
      {
        title: 'Infrazioni e Sanzioni',
        content: `<doc>
  <heading>Infrazioni e Relative Sanzioni</heading>
  <para>La seguente tabella riporta le principali infrazioni stradali e le relative sanzioni:</para>
  <table cols="Infrazione,Multa ($),Punti Patente">
    <row>Eccesso di velocita (10-30 km/h)|500|2</row>
    <row>Eccesso di velocita (oltre 30 km/h)|1000|4</row>
    <row>Passaggio con semaforo rosso|800|3</row>
    <row>Guida in stato di ebbrezza|1500|10</row>
    <row>Utilizzo del cellulare alla guida|300|2</row>
    <row>Mancato utilizzo delle cinture|200|1</row>
    <row>Sosta in divieto|150|0</row>
    <row>Guida senza patente|2000|N/A</row>
  </table>
</doc>`,
      },
    ],
  },
  'codice-penale': {
    title: 'Codice Penale',
    topics: [
      {
        title: 'Reati e Pene',
        content: `<doc>
  <heading>Reati e Relative Pene</heading>
  <para>La seguente tabella riporta i principali reati e le relative sanzioni previste:</para>
  <table cols="Reato,Multa ($),Mesi Reclusione">
    <row>Rapina a mano armata|5000|20</row>
    <row>Furto|1500|8</row>
    <row>Aggressione|2000|10</row>
    <row>Possesso di sostanze stupefacenti|2500|12</row>
    <row>Resistenza all&apos;arresto|1800|7</row>
    <row>Oltraggio a pubblico ufficiale|1000|5</row>
    <row>Omicidio|15000|35</row>
    <row>Tentato omicidio|10000|25</row>
    <row>Violazione di domicilio|2000|8</row>
    <row>Furto d&apos;auto|4000|12</row>
  </table>
</doc>`,
      },
    ],
  },
};

// GET /api/normative/sections
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    const sections: NormativeSectionsData = setting
      ? (JSON.parse(setting.value) as NormativeSectionsData)
      : DEFAULT_SECTIONS;

    return NextResponse.json({ sections });
  } catch {
    return NextResponse.json({ error: 'Errore durante il recupero delle sezioni' }, { status: 500 });
  }
}

// PUT /api/normative/sections
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const { sections } = (await req.json()) as { sections: NormativeSectionsData };

    if (typeof sections !== 'object' || sections === null || Array.isArray(sections)) {
      return NextResponse.json({ error: 'Formato non valido' }, { status: 400 });
    }

    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(sections) },
      create: { key: SETTING_KEY, value: JSON.stringify(sections) },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Errore durante il salvataggio delle sezioni' }, { status: 500 });
  }
}
