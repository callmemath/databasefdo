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
  ChevronDown,
  Menu,
  X,
  Search,
  Tag,
  Loader2,
} from 'lucide-react';
import type { NormativeSectionsData } from '../api/normative/sections/route';
import { renderMarkdownContent } from '@/lib/normative-md';

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
  sectionId?: string;
  crimes: Crime[];
}

interface StaticTopic {
  title: string;
  content: string;
}

// ----- Icon mapping for static sections -----
const SECTION_ICON_MAP: Record<string, React.ReactNode> = {
  'codici-radio': <FileText className="h-4 w-4 shrink-0" />,
  'procedure-operative': <Book className="h-4 w-4 shrink-0" />,
  'codice-stradale': <Info className="h-4 w-4 shrink-0" />,
  'codice-penale': <BookOpen className="h-4 w-4 shrink-0" />,
};

const DEFAULT_SECTION_ICON = <FileText className="h-4 w-4 shrink-0" />;

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

// Prev/next uses only top-level section IDs — categories are anchors within their section.
function buildFlatNavIds(sectionsData: NormativeSectionsData): string[] {
  return Object.keys(sectionsData);
}

export default function NormativePage() {
  const router = useRouter();
  const { status } = useSession();

  const [sectionsData, setSectionsData] = useState<NormativeSectionsData>({});
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [categories, setCategories] = useState<CrimeCategory[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/normative');
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchSections = async () => {
      setSectionsLoading(true);
      try {
        const res = await fetch('/api/normative/sections');
        if (res.ok) {
          const data = await res.json();
          const fetched: NormativeSectionsData = data.sections ?? {};
          setSectionsData(fetched);
          // Set default active section to first key
          const firstKey = Object.keys(fetched)[0];
          if (firstKey) setActiveSection(firstKey);
          return fetched;
        }
      } catch {
        // silent fail
      } finally {
        setSectionsLoading(false);
      }
    };

    const fetchCategories = async (fetchedSections: NormativeSectionsData) => {
      try {
        const res = await fetch('/api/crimes/categories');
        if (res.ok) {
          const data = await res.json();
          const cats: CrimeCategory[] = data.categories ?? [];
          setCategories(cats);
          // Auto-expand sections that have at least one category pointing to them
          const toExpand = new Set<string>();
          for (const sectionId of Object.keys(fetchedSections)) {
            if (cats.some((c) => c.sectionId === sectionId)) toExpand.add(sectionId);
          }
          setExpandedSections(toExpand);
        }
      } catch {
        // silent fail
      } finally {
        setCatLoading(false);
      }
    };

    fetchSections().then((fetched) => fetchCategories(fetched ?? {}));
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

  if (sectionsLoading || catLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Caricamento normative...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Build STATIC_CONTENT from fetched data
  const STATIC_CONTENT: Record<string, StaticTopic[]> = {};
  for (const [id, section] of Object.entries(sectionsData)) {
    STATIC_CONTENT[id] = section.topics;
  }

  // Flat ID list for prev/next navigation (sections only)
  const flatNavIds = buildFlatNavIds(sectionsData);
  const activeIndex = flatNavIds.indexOf(activeSection);

  // Resolve display title for a nav ID
  const resolveTitle = (id: string): string => {
    if (id.startsWith('cat-')) {
      const catId = id.slice(4);
      return categories.find((c) => c.id === catId)?.name ?? id;
    }
    return sectionsData[id]?.title ?? id;
  };

  const prevId = activeIndex > 0 ? flatNavIds[activeIndex - 1] : null;
  const nextId = activeIndex < flatNavIds.length - 1 ? flatNavIds[activeIndex + 1] : null;

  // Static topics for the active section
  const activeStaticContent = STATIC_CONTENT[activeSection] ?? [];
  // Crime categories belonging to the active section
  const activeSectionCats = categories.filter((c) => c.sectionId === activeSection);

  // Search filtering
  const filteredStaticContent = searchQuery
    ? activeStaticContent.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeStaticContent;

  const filteredSectionCats = searchQuery
    ? activeSectionCats
        .map((cat) => ({
          ...cat,
          crimes: cat.crimes.filter(
            (c) =>
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.description.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.crimes.length > 0 || cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeSectionCats;

  const handleSectionChange = (id: string) => {
    setActiveSection(id);
    setSearchQuery('');
    setMobileSidebarOpen(false);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCategory = (catId: string) => {
    setMobileSidebarOpen(false);
    const el = document.getElementById(`cat-${catId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeSectionTitle = sectionsData[activeSection]?.title ?? '';

  // Icon strip keys for collapsed sidebar (static sections only)
  const staticSectionIds = Object.keys(sectionsData);

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Normative
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {Object.entries(sectionsData).map(([sectionId, section]) => {
          const isActive = activeSection === sectionId;
          const sectionCats = categories.filter((c) => c.sectionId === sectionId);
          const hasSectionCats = sectionCats.length > 0;
          const isExpanded = expandedSections.has(sectionId);

          return (
            <div key={sectionId}>
              {/* Section row */}
              <button
                onClick={() => {
                  handleSectionChange(sectionId);
                  if (hasSectionCats) {
                    // Ensure expanded when navigating to this section
                    setExpandedSections((prev) => new Set([...prev, sectionId]));
                  }
                }}
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
                {SECTION_ICON_MAP[sectionId] ?? DEFAULT_SECTION_ICON}
                <span className="truncate flex-1 text-left">{section.title}</span>
                {hasSectionCats && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(sectionId);
                    }}
                    className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </span>
                )}
              </button>

              {/* Sub-items: crime categories as scroll anchors within this section */}
              {hasSectionCats && isExpanded &&
                sectionCats.map((cat) => {
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (activeSection !== sectionId) {
                          handleSectionChange(sectionId);
                          // Scroll after state update + render
                          setTimeout(() => scrollToCategory(cat.id), 80);
                        } else {
                          scrollToCategory(cat.id);
                        }
                      }}
                      className="w-full flex items-center gap-2 pl-6 pr-4 py-1.5 text-xs transition-colors text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${COLOR_DOT[cat.color] ?? COLOR_DOT.gray}`}
                      />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
            </div>
          );
        })}
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
            {staticSectionIds.map((id) => (
              <span
                key={id}
                title={sectionsData[id]?.title ?? id}
                className={`h-1.5 w-1.5 rounded-full ${
                  activeSection === id ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          {/* Expanded: full sidebar */}
          <div className="hidden group-hover/sidebar:flex flex-col flex-1 overflow-hidden w-72">
            <SidebarContent />
          </div>
        </div>

        {/* Main content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
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

            {/* Content area: static topics + crime categories inline as subsections */}
            <div>
              {filteredStaticContent.length === 0 && filteredSectionCats.length === 0 && searchQuery ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>Nessun risultato per &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {/* Static topics */}
                  {filteredStaticContent.map((topic, index) => (
                    <div key={index}>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8 first:mt-0">
                        {topic.title}
                      </h2>
                      {renderMarkdownContent(topic.content)}
                    </div>
                  ))}

                  {/* Dynamic crime categories as subsections */}
                  {filteredSectionCats.map((cat) => (
                    <div key={cat.id} id={`cat-${cat.id}`} className="mt-10 scroll-mt-6">
                      <div className="flex items-center gap-2.5 mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white m-0">
                          {cat.name}
                        </h2>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium not-prose ${
                            COLOR_BADGE[cat.color] ?? COLOR_BADGE.gray
                          }`}
                        >
                          <Tag className="h-3 w-3" />
                          Categoria
                        </span>
                      </div>
                      {cat.crimes.length === 0 ? (
                        <p className="text-gray-400 text-sm italic">
                          Nessun reato in questa categoria. Aggiungili dalla pagina di configurazione.
                        </p>
                      ) : (
                        <div className="not-prose overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
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
                              {cat.crimes.map((crime) => (
                                <tr
                                  key={crime.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                                >
                                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                    {crime.name}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs">
                                    {crime.description || <span className="italic text-gray-400">—</span>}
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
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prev / Next navigation */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              {prevId ? (
                <button
                  onClick={() => handleSectionChange(prevId)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors group"
                >
                  <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>
                    <div className="text-xs text-gray-400 mb-0.5">Precedente</div>
                    <div className="font-medium">{resolveTitle(prevId)}</div>
                  </span>
                </button>
              ) : (
                <div />
              )}
              {nextId ? (
                <button
                  onClick={() => handleSectionChange(nextId)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors group text-right"
                >
                  <span>
                    <div className="text-xs text-gray-400 mb-0.5">Successivo</div>
                    <div className="font-medium">{resolveTitle(nextId)}</div>
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
