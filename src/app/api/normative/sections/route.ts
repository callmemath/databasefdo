import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export interface NormativeTopic {
  title: string;
  /** Topic content as Markdown string (GFM supported) */
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
        content: `I seguenti codici sono utilizzati nelle comunicazioni radio per indicare situazioni di emergenza:

| Codice | Significato |
|--------|-------------|
| Codice 0 | Emergenza massima, agente in pericolo di vita |
| Codice 1 | Richiesta di supporto urgente, situazione critica |
| Codice 2 | Rispondere rapidamente, ma senza sirene o luci |
| Codice 3 | Rispondere con sirene e luci, emergenza |`,
      },
      {
        title: 'Codici di Situazione',
        content: `Utilizzare questi codici per comunicare lo stato delle situazioni:

| Codice | Significato |
|--------|-------------|
| Codice 4 | Situazione sotto controllo, non è richiesto ulteriore supporto |
| Codice 5 | Arresto in corso, richiesta di supporto per trasporto |
| Codice 6 | Indagine in corso, rimanere in attesa di istruzioni |
| Codice 7 | Pausa pranzo/cena, agente temporaneamente non disponibile |`,
      },
      {
        title: 'Codici Operativi',
        content: `Questi codici sono utilizzati per le operazioni quotidiane:

| Codice | Significato |
|--------|-------------|
| Codice 10 | In servizio, disponibile per chiamate |
| Codice 11 | Fermo veicolo in corso, controllo documenti |
| Codice 12 | Richiesta informazioni su targa o individuo |
| Codice 13 | Richiesta assistenza sanitaria |`,
      },
    ],
  },
  'procedure-operative': {
    title: 'Procedure Operative',
    topics: [
      {
        title: 'Procedure di Arresto',
        content: `Le seguenti procedure devono essere seguite durante un arresto:

### 1. Identificazione e Valutazione

- Identificare il sospetto e verificare eventuali mandati esistenti
- Valutare la situazione per determinare il livello di rischio
- Richiedere rinforzi se necessario prima di procedere

### 2. Approccio e Comunicazione

- Identificarsi chiaramente come agente di polizia
- Informare il sospetto del motivo dell'arresto
- Utilizzare comandi chiari e diretti
- Mantenere una distanza di sicurezza appropriata

### 3. Contenimento e Ammanettamento

- Utilizzare la forza minima necessaria per effettuare l'arresto
- Posizionare le manette con le mani dietro la schiena quando possibile
- Verificare che le manette non siano troppo strette
- Perquisire il sospetto per eventuali armi o prove

### 4. Trasporto e Registrazione

- Trasportare il sospetto al dipartimento di polizia
- Leggere i diritti al sospetto durante il trasporto
- Documentare tutte le fasi dell'arresto
- Registrare l'arresto nel sistema FDO`,
      },
      {
        title: 'Gestione delle Scene del Crimine',
        content: `Le seguenti linee guida devono essere seguite durante l'intervento su una scena del crimine:

### 1. Arrivo sulla Scena

- Valutare la sicurezza dell'area e dei presenti
- Prestare primo soccorso a eventuali feriti
- Chiamare rinforzi e servizi medici se necessario
- Stabilire un perimetro di sicurezza

### 2. Protezione della Scena

- Delimitare l'area con nastro segnaletico
- Registrare i nomi di tutte le persone presenti all'arrivo
- Allontanare i non addetti ai lavori
- Proteggere le prove da contaminazione e agenti atmosferici`,
      },
    ],
  },
  'codice-stradale': {
    title: 'Codice Stradale',
    topics: [
      {
        title: 'Infrazioni e Sanzioni',
        content: `La seguente tabella riporta le principali infrazioni stradali e le relative sanzioni:

| Infrazione | Multa ($) | Punti Patente |
|------------|-----------|---------------|
| Eccesso di velocità (10-30 km/h) | 500 | 2 |
| Eccesso di velocità (oltre 30 km/h) | 1000 | 4 |
| Passaggio con semaforo rosso | 800 | 3 |
| Guida in stato di ebbrezza | 1500 | 10 |
| Utilizzo del cellulare alla guida | 300 | 2 |
| Mancato utilizzo delle cinture | 200 | 1 |
| Sosta in divieto | 150 | 0 |
| Guida senza patente | 2000 | N/A |`,
      },
    ],
  },
  'codice-penale': {
    title: 'Codice Penale',
    topics: [
      {
        title: 'Reati e Pene',
        content: `La seguente tabella riporta i principali reati e le relative sanzioni previste:

| Reato | Multa ($) | Mesi Reclusione |
|-------|-----------|-----------------|
| Rapina a mano armata | 5000 | 20 |
| Furto | 1500 | 8 |
| Aggressione | 2000 | 10 |
| Possesso di sostanze stupefacenti | 2500 | 12 |
| Resistenza all'arresto | 1800 | 7 |
| Oltraggio a pubblico ufficiale | 1000 | 5 |
| Omicidio | 15000 | 35 |
| Tentato omicidio | 10000 | 25 |
| Violazione di domicilio | 2000 | 8 |
| Furto d'auto | 4000 | 12 |`,
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
