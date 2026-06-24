'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MainLayout from '../../components/layout/MainLayout';
import {
  FileText,
  Book,
  Info,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Tag,
  Loader2,
} from 'lucide-react';

// ----- Types -----
interface Crime {
  id: string;
  name: string;
  description: string;
  sentence: string;
  fine: number;
  order: number;
}

interface CrimeCategory {
  id: string;
  name: string;
  color: string;
  order: number;
  crimes: Crime[];
}

// ----- Static section data -----
interface StaticTopic {
  title: string;
  content: string;
}

const STATIC_SECTIONS: Array<{ id: string; title: string; icon: React.ReactNode; isCategory?: boolean; color?: string }> = [
  { id: 'codici-radio', title: 'Codici Radio', icon: <FileText className="h-4 w-4 shrink-0" /> },
  { id: 'procedure-operative', title: 'Procedure Operative', icon: <Book className="h-4 w-4 shrink-0" /> },
  { id: 'codice-stradale', title: 'Codice Stradale', icon: <Info className="h-4 w-4 shrink-0" /> },
  { id: 'codice-penale', title: 'Codice Penale', icon: <BookOpen className="h-4 w-4 shrink-0" /> },
];

const STATIC_CONTENT: Record<string, StaticTopic[]> = {
  'codici-radio': [
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
  'procedure-operative': [
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
  'codice-stradale': [
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
  'codice-penale': [
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
};

// ----- Color mapping -----
const COLOR_BADGE: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const COLOR_DOT: Record<string, string> = {
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-500',
};

// Build the full ordered navigation list from static sections + dynamic categories
function buildNavItems(
  categories: CrimeCategory[]
): Array<{ id: string; title: string; icon: React.ReactNode; isCategory?: boolean; color?: string }> {
  const items = STATIC_SECTIONS.map((s) => ({ ...s, isCategory: false }));

  if (categories.length > 0) {
    // separator is visual only — not a real nav item, handled separately
    categories.forEach((cat) => {
      items.push({
        id: `cat-${cat.id}`,
        title: cat.name,
        icon: <Tag className="h-4 w-4 shrink-0" />,
        isCategory: true,
        color: cat.color,
      });
    });
  }

  return items;
}

export default function NormativePage() {
  const router = useRouter();
  const { status } = useSession();

  const [categories, setCategories] = useState<CrimeCategory[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('codici-radio');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/normative');
    }
  }, [router, status]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/crimes/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories ?? []);
        }
      } catch {
        // silent fail — categories just won't show
      } finally {
        setCatLoading(false);
      }
    };
    if (status === 'authenticated') {
      fetchCategories();
    }
  }, [status]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Verifica accesso in corso...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  const navItems = buildNavItems(categories);

  // Build a flat list of section IDs for prev/next navigation
  const sectionIds = navItems.map((item) => item.id);
  const activeIndex = sectionIds.indexOf(activeSection);

  const prevSection = activeIndex > 0 ? navItems[activeIndex - 1] : null;
  const nextSection = activeIndex < navItems.length - 1 ? navItems[activeIndex + 1] : null;

  // Resolve active category if it's a dynamic one
  const activeCategoryId = activeSection.startsWith('cat-')
    ? activeSection.slice(4)
    : null;
  const activeCategory = activeCategoryId
    ? categories.find((c) => c.id === activeCategoryId)
    : null;
  const activeStaticContent =
    !activeCategoryId ? STATIC_CONTENT[activeSection] ?? [] : [];

  // Search filtering
  const filteredStaticContent = searchQuery
    ? activeStaticContent.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeStaticContent;

  const filteredCrimes = searchQuery && activeCategory
    ? activeCategory.crimes.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCategory?.crimes ?? [];

  const handleSectionChange = (id: string) => {
    setActiveSection(id);
    setSearchQuery('');
    setMobileSidebarOpen(false);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeSectionTitle =
    navItems.find((item) => item.id === activeSection)?.title ?? '';

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Normative
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item, idx) => {
          // Show separator before first category
          const prevItem = navItems[idx - 1];
          const showSeparator = item.isCategory && prevItem && !prevItem.isCategory;
          const isActive = activeSection === item.id;

          return (
            <div key={item.id}>
              {showSeparator && (
                <div className="px-4 py-2 mt-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                    <span>Normative</span>
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                  </div>
                </div>
              )}
              <button
                onClick={() => handleSectionChange(item.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors relative
                  ${
                    isActive
                      ? 'font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600 dark:bg-blue-400 rounded-r" />
                )}
                {item.isCategory && item.color ? (
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${COLOR_DOT[item.color] ?? COLOR_DOT.gray}`}
                  />
                ) : (
                  item.icon
                )}
                <span className="truncate">{item.title}</span>
              </button>
            </div>
          );
        })}
        {catLoading && (
          <div className="px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Caricamento normative...
          </div>
        )}
      </nav>
    </div>
  );

  return (
    <MainLayout>
      {/* Mobile overlay sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 bg-white dark:bg-gray-900 shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">Indice</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      <div className="flex h-full min-h-[calc(100vh-80px)]">
        {/* Desktop sidebar — collapsible via CSS hover */}
        <div className="hidden lg:flex flex-col group/sidebar w-10 hover:w-72 shrink-0 transition-all duration-200 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden sticky top-0 self-start max-h-[calc(100vh-80px)]">
          {/* Collapsed: show icon strip */}
          <div className="flex flex-col items-center py-4 gap-2 group-hover/sidebar:hidden">
            <BookOpen className="h-5 w-5 text-gray-400" />
            {STATIC_SECTIONS.map((s) => (
              <span
                key={s.id}
                title={s.title}
                className={`h-1.5 w-1.5 rounded-full ${activeSection === s.id ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              />
            ))}
          </div>
          {/* Expanded: full sidebar */}
          <div className="hidden group-hover/sidebar:flex flex-col flex-1 overflow-hidden w-72">
            <SidebarContent />
          </div>
        </div>

        {/* Main content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-6">
              <BookOpen className="h-4 w-4" />
              <span>Normative</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-700 dark:text-gray-300">{activeSectionTitle}</span>
              {/* Mobile hamburger inline with breadcrumb */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="ml-auto lg:hidden flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {activeSectionTitle}
            </h1>
            {activeCategory && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium mb-4 ${
                  COLOR_BADGE[activeCategory.color] ?? COLOR_BADGE.gray
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${COLOR_DOT[activeCategory.color] ?? COLOR_DOT.gray}`}
                />
                Categoria normativa
              </span>
            )}

            {/* Search bar */}
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Cerca in ${activeSectionTitle}...`}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            {/* Content area */}
            {activeCategoryId ? (
              // Dynamic crimes table
              <div>
                {activeCategory ? (
                  activeCategory.crimes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Tag className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p>Nessun reato in questa categoria.</p>
                      <p className="text-sm mt-1">Aggiungi reati dalla pagina di configurazione.</p>
                    </div>
                  ) : filteredCrimes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p>Nessun risultato per &quot;{searchQuery}&quot;</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs">
                              Nome reato
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs">
                              Descrizione
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs whitespace-nowrap">
                              Pena
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs whitespace-nowrap">
                              Sanzione (€)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                          {filteredCrimes.map((crime) => (
                            <tr
                              key={crime.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                            >
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                {crime.name}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs">
                                {crime.description || (
                                  <span className="italic text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-blue-700 dark:text-blue-400 whitespace-nowrap font-mono text-xs">
                                {crime.sentence}
                              </td>
                              <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap font-mono text-xs">
                                {crime.fine > 0 ? (
                                  `€ ${crime.fine.toLocaleString('it-IT')}`
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
                    Caricamento...
                  </div>
                )}
              </div>
            ) : (
              // Static section content
              <div className="space-y-10">
                {filteredStaticContent.length === 0 && searchQuery ? (
                  <div className="text-center py-12 text-gray-400">
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>Nessun risultato per &quot;{searchQuery}&quot;</p>
                  </div>
                ) : (
                  filteredStaticContent.map((topic, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-800 pb-10 last:border-0"
                    >
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        {topic.title}
                      </h2>
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: topic.content }}
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Prev / Next navigation */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              {prevSection ? (
                <button
                  onClick={() => handleSectionChange(prevSection.id)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors group"
                >
                  <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>
                    <div className="text-xs text-gray-400 mb-0.5">Precedente</div>
                    <div className="font-medium">{prevSection.title}</div>
                  </span>
                </button>
              ) : (
                <div />
              )}
              {nextSection ? (
                <button
                  onClick={() => handleSectionChange(nextSection.id)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors group text-right"
                >
                  <span>
                    <div className="text-xs text-gray-400 mb-0.5">Successivo</div>
                    <div className="font-medium">{nextSection.title}</div>
                  </span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: floating toggle button */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed bottom-6 left-6 lg:hidden z-40 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Apri indice"
      >
        <BookOpen className="h-5 w-5" />
      </button>
    </MainLayout>
  );
}
