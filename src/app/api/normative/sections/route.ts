import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export interface NormativeTopic {
  title: string;
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
        content: `
        <h3 class="text-lg font-semibold mb-3">Codici Radio di Emergenza</h3>
        <p class="mb-4">I seguenti codici sono utilizzati nelle comunicazioni radio per indicare situazioni di emergenza:</p>
        <div class="space-y-3">
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 0</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Emergenza massima, agente in pericolo di vita.</div>
          </div>
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 1</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Richiesta di supporto urgente, situazione critica.</div>
          </div>
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 2</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Rispondere rapidamente, ma senza sirene o luci.</div>
          </div>
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 3</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Rispondere con sirene e luci, emergenza.</div>
          </div>
        </div>
      `,
      },
      {
        title: 'Codici di Situazione',
        content: `
        <h3 class="text-lg font-semibold mb-3">Codici di Situazione</h3>
        <p class="mb-4">Utilizzare questi codici per comunicare lo stato delle situazioni:</p>
        <div class="space-y-3">
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 4</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Situazione sotto controllo, non è richiesto ulteriore supporto.</div>
          </div>
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 5</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Arresto in corso, richiesta di supporto per trasporto.</div>
          </div>
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 6</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Indagine in corso, rimanere in attesa di istruzioni.</div>
          </div>
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 7</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Pausa pranzo/cena, agente temporaneamente non disponibile.</div>
          </div>
        </div>
      `,
      },
      {
        title: 'Codici Operativi',
        content: `
        <h3 class="text-lg font-semibold mb-3">Codici Operativi</h3>
        <p class="mb-4">Questi codici sono utilizzati per le operazioni quotidiane:</p>
        <div class="space-y-3">
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 10</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">In servizio, disponibile per chiamate.</div>
          </div>
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 11</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Fermo veicolo in corso, controllo documenti.</div>
          </div>
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 12</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Richiesta informazioni su targa o individuo.</div>
          </div>
          <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="font-medium text-gray-900 dark:text-white">Codice 13</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Richiesta assistenza sanitaria.</div>
          </div>
        </div>
      `,
      },
    ],
  },
  'procedure-operative': {
    title: 'Procedure Operative',
    topics: [
      {
        title: 'Procedure di Arresto',
        content: `
        <h3 class="text-lg font-semibold mb-3">Procedure Standard di Arresto</h3>
        <p class="mb-4">Le seguenti procedure devono essere seguite durante un arresto:</p>
        <div class="space-y-5">
          <div>
            <h4 class="font-medium text-blue-700 dark:text-blue-400 mb-2">1. Identificazione e Valutazione</h4>
            <ul class="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Identificare il sospetto e verificare eventuali mandati esistenti</li>
              <li>Valutare la situazione per determinare il livello di rischio</li>
              <li>Richiedere rinforzi se necessario prima di procedere</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-blue-700 dark:text-blue-400 mb-2">2. Approccio e Comunicazione</h4>
            <ul class="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Identificarsi chiaramente come agente di polizia</li>
              <li>Informare il sospetto del motivo dell'arresto</li>
              <li>Utilizzare comandi chiari e diretti</li>
              <li>Mantenere una distanza di sicurezza appropriata</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-blue-700 dark:text-blue-400 mb-2">3. Contenimento e Ammanettamento</h4>
            <ul class="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Utilizzare la forza minima necessaria per effettuare l'arresto</li>
              <li>Posizionare le manette con le mani dietro la schiena quando possibile</li>
              <li>Verificare che le manette non siano troppo strette</li>
              <li>Perquisire il sospetto per eventuali armi o prove</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-blue-700 dark:text-blue-400 mb-2">4. Trasporto e Registrazione</h4>
            <ul class="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Trasportare il sospetto al dipartimento di polizia</li>
              <li>Leggere i diritti al sospetto durante il trasporto</li>
              <li>Documentare tutte le fasi dell'arresto</li>
              <li>Registrare l'arresto nel sistema FDO</li>
            </ul>
          </div>
        </div>
      `,
      },
      {
        title: 'Gestione delle Scene del Crimine',
        content: `
        <h3 class="text-lg font-semibold mb-3">Procedure per la Gestione delle Scene del Crimine</h3>
        <p class="mb-4">Le seguenti linee guida devono essere seguite durante l'intervento su una scena del crimine:</p>
        <div class="space-y-5">
          <div>
            <h4 class="font-medium text-blue-700 dark:text-blue-400 mb-2">1. Arrivo sulla Scena</h4>
            <ul class="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Valutare la sicurezza dell'area e dei presenti</li>
              <li>Prestare primo soccorso a eventuali feriti</li>
              <li>Chiamare rinforzi e servizi medici se necessario</li>
              <li>Stabilire un perimetro di sicurezza</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-blue-700 dark:text-blue-400 mb-2">2. Protezione della Scena</h4>
            <ul class="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Delimitare l'area con nastro segnaletico</li>
              <li>Registrare i nomi di tutte le persone presenti all'arrivo</li>
              <li>Allontanare i non addetti ai lavori</li>
              <li>Proteggere le prove da contaminazione e agenti atmosferici</li>
            </ul>
          </div>
        </div>
      `,
      },
    ],
  },
  'codice-stradale': {
    title: 'Codice Stradale',
    topics: [
      {
        title: 'Infrazioni e Sanzioni',
        content: `
        <h3 class="text-lg font-semibold mb-3">Infrazioni e Relative Sanzioni</h3>
        <p class="mb-4">La seguente tabella riporta le principali infrazioni stradali e le relative sanzioni:</p>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Infrazione</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Multa ($)</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Punti Patente</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Eccesso di velocità (10-30 km/h)</td><td class="px-4 py-2">500</td><td class="px-4 py-2">2</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Eccesso di velocità (oltre 30 km/h)</td><td class="px-4 py-2">1000</td><td class="px-4 py-2">4</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Passaggio con semaforo rosso</td><td class="px-4 py-2">800</td><td class="px-4 py-2">3</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Guida in stato di ebbrezza</td><td class="px-4 py-2">1500</td><td class="px-4 py-2">10</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Utilizzo del cellulare alla guida</td><td class="px-4 py-2">300</td><td class="px-4 py-2">2</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Mancato utilizzo delle cinture</td><td class="px-4 py-2">200</td><td class="px-4 py-2">1</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Sosta in divieto</td><td class="px-4 py-2">150</td><td class="px-4 py-2">0</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Guida senza patente</td><td class="px-4 py-2">2000</td><td class="px-4 py-2">N/A</td></tr>
            </tbody>
          </table>
        </div>
      `,
      },
    ],
  },
  'codice-penale': {
    title: 'Codice Penale',
    topics: [
      {
        title: 'Reati e Pene',
        content: `
        <h3 class="text-lg font-semibold mb-3">Reati e Relative Pene</h3>
        <p class="mb-4">La seguente tabella riporta i principali reati e le relative sanzioni previste:</p>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reato</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Multa ($)</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mesi Reclusione</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Rapina a mano armata</td><td class="px-4 py-2">5000</td><td class="px-4 py-2">20</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Furto</td><td class="px-4 py-2">1500</td><td class="px-4 py-2">8</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Aggressione</td><td class="px-4 py-2">2000</td><td class="px-4 py-2">10</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Possesso di sostanze stupefacenti</td><td class="px-4 py-2">2500</td><td class="px-4 py-2">12</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Resistenza all'arresto</td><td class="px-4 py-2">1800</td><td class="px-4 py-2">7</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Oltraggio a pubblico ufficiale</td><td class="px-4 py-2">1000</td><td class="px-4 py-2">5</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Omicidio</td><td class="px-4 py-2">15000</td><td class="px-4 py-2">35</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Tentato omicidio</td><td class="px-4 py-2">10000</td><td class="px-4 py-2">25</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Violazione di domicilio</td><td class="px-4 py-2">2000</td><td class="px-4 py-2">8</td></tr>
              <tr><td class="px-4 py-2 text-gray-900 dark:text-white">Furto d'auto</td><td class="px-4 py-2">4000</td><td class="px-4 py-2">12</td></tr>
            </tbody>
          </table>
        </div>
      `,
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
