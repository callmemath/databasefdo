'use client';

import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { ChevronRight, Book, Search, FileText, BookOpen, Info } from 'lucide-react';
import SearchInput from '../../components/ui/SearchInput';

export default function Codes() {
  const [activeSection, setActiveSection] = useState('codici-radio');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for sections
  const sections = [
    { id: 'codici-radio', title: 'Codici Radio', icon: <FileText className="h-4 w-4" /> },
    { id: 'procedure-operative', title: 'Procedure Operative', icon: <Book className="h-4 w-4" /> },
    { id: 'codice-stradale', title: 'Codice Stradale', icon: <Info className="h-4 w-4" /> },
    { id: 'codice-penale', title: 'Codice Penale', icon: <BookOpen className="h-4 w-4" /> },
  ];
  
  // Mock data for code content
  const codeContent = {
    'codici-radio': [
      {
        title: 'Codici di Emergenza',
        content: `
          <h3 class="text-lg font-semibold mb-3">Codici Radio di Emergenza</h3>
          <p class="mb-4">I seguenti codici sono utilizzati nelle comunicazioni radio per indicare situazioni di emergenza:</p>
          <div class="space-y-4">
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 0</div>
              <div class="text-sm text-police-gray-dark">Emergenza massima, agente in pericolo di vita.</div>
            </div>
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 1</div>
              <div class="text-sm text-police-gray-dark">Richiesta di supporto urgente, situazione critica.</div>
            </div>
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 2</div>
              <div class="text-sm text-police-gray-dark">Rispondere rapidamente, ma senza sirene o luci.</div>
            </div>
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 3</div>
              <div class="text-sm text-police-gray-dark">Rispondere con sirene e luci, emergenza.</div>
            </div>
          </div>
        `
      },
      {
        title: 'Codici di Situazione',
        content: `
          <h3 class="text-lg font-semibold mb-3">Codici di Situazione</h3>
          <p class="mb-4">Utilizzare questi codici per comunicare lo stato delle situazioni:</p>
          <div class="space-y-4">
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 4</div>
              <div class="text-sm text-police-gray-dark">Situazione sotto controllo, non è richiesto ulteriore supporto.</div>
            </div>
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 5</div>
              <div class="text-sm text-police-gray-dark">Arresto in corso, richiesta di supporto per trasporto.</div>
            </div>
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 6</div>
              <div class="text-sm text-police-gray-dark">Indagine in corso, rimanere in attesa di istruzioni.</div>
            </div>
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 7</div>
              <div class="text-sm text-police-gray-dark">Pausa pranzo/cena, agente temporaneamente non disponibile.</div>
            </div>
          </div>
        `
      },
      {
        title: 'Codici Operativi',
        content: `
          <h3 class="text-lg font-semibold mb-3">Codici Operativi</h3>
          <p class="mb-4">Questi codici sono utilizzati per le operazioni quotidiane:</p>
          <div class="space-y-4">
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 10</div>
              <div class="text-sm text-police-gray-dark">In servizio, disponibile per chiamate.</div>
            </div>
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 11</div>
              <div class="text-sm text-police-gray-dark">Fermo veicolo in corso, controllo documenti.</div>
            </div>
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 12</div>
              <div class="text-sm text-police-gray-dark">Richiesta informazioni su targa o individuo.</div>
            </div>
            <div class="p-3 border border-police-gray rounded-md">
              <div class="font-medium">Codice 13</div>
              <div class="text-sm text-police-gray-dark">Richiesta assistenza sanitaria.</div>
            </div>
          </div>
        `
      },
    ],
    'procedure-operative': [
      {
        title: 'Procedure di Arresto',
        content: `
          <h3 class="text-lg font-semibold mb-3">Procedure Standard di Arresto</h3>
          <p class="mb-4">Le seguenti procedure devono essere seguite durante un arresto:</p>
          
          <div class="space-y-6">
            <div>
              <h4 class="font-medium text-police-blue-dark mb-2">1. Identificazione e Valutazione</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm">
                <li>Identificare il sospetto e verificare eventuali mandati esistenti</li>
                <li>Valutare la situazione per determinare il livello di rischio</li>
                <li>Richiedere rinforzi se necessario prima di procedere</li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-medium text-police-blue-dark mb-2">2. Approccio e Comunicazione</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm">
                <li>Identificarsi chiaramente come agente di polizia</li>
                <li>Informare il sospetto del motivo dell'arresto</li>
                <li>Utilizzare comandi chiari e diretti</li>
                <li>Mantenere una distanza di sicurezza appropriata</li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-medium text-police-blue-dark mb-2">3. Contenimento e Ammanettamento</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm">
                <li>Utilizzare la forza minima necessaria per effettuare l'arresto</li>
                <li>Posizionare le manette con le mani dietro la schiena quando possibile</li>
                <li>Verificare che le manette non siano troppo strette</li>
                <li>Perquisire il sospetto per eventuali armi o prove</li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-medium text-police-blue-dark mb-2">4. Trasporto e Registrazione</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm">
                <li>Trasportare il sospetto al dipartimento di polizia</li>
                <li>Leggere i diritti al sospetto durante il trasporto</li>
                <li>Documentare tutte le fasi dell'arresto</li>
                <li>Registrare l'arresto nel sistema FDO</li>
              </ul>
            </div>
          </div>
        `
      },
      {
        title: 'Gestione delle Scene del Crimine',
        content: `
          <h3 class="text-lg font-semibold mb-3">Procedure per la Gestione delle Scene del Crimine</h3>
          <p class="mb-4">Le seguenti linee guida devono essere seguite durante l'intervento su una scena del crimine:</p>
          
          <div class="space-y-6">
            <div>
              <h4 class="font-medium text-police-blue-dark mb-2">1. Arrivo sulla Scena</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm">
                <li>Valutare la sicurezza dell'area e dei presenti</li>
                <li>Prestare primo soccorso a eventuali feriti</li>
                <li>Chiamare rinforzi e servizi medici se necessario</li>
                <li>Stabilire un perimetro di sicurezza</li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-medium text-police-blue-dark mb-2">2. Protezione della Scena</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm">
                <li>Delimitare l'area con nastro segnaletico</li>
                <li>Registrare i nomi di tutte le persone presenti all'arrivo</li>
                <li>Allontanare i non addetti ai lavori</li>
                <li>Proteggere le prove da contaminazione e agenti atmosferici</li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-medium text-police-blue-dark mb-2">3. Documentazione Iniziale</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm">
                <li>Fotografare la scena prima di qualsiasi intervento</li>
                <li>Prendere nota della posizione di oggetti e persone</li>
                <li>Registrare condizioni ambientali (ora, meteo, illuminazione)</li>
                <li>Raccogliere le prime testimonianze</li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-medium text-police-blue-dark mb-2">4. Raccolta Prove</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm">
                <li>Indossare guanti e protezioni per evitare contaminazioni</li>
                <li>Raccogliere e catalogare ogni prova con metodologia</li>
                <li>Fotografare ogni prova prima del prelievo</li>
                <li>Garantire la catena di custodia delle prove</li>
              </ul>
            </div>
          </div>
        `
      }
    ],
    'codice-stradale': [
      {
        title: 'Infrazioni e Sanzioni',
        content: `
          <h3 class="text-lg font-semibold mb-3">Infrazioni e Relative Sanzioni</h3>
          <p class="mb-4">La seguente tabella riporta le principali infrazioni stradali e le relative sanzioni:</p>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-police-gray dark:divide-gray-600">
              <thead class="bg-police-gray-light dark:bg-gray-700">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-police-blue-dark dark:text-white uppercase tracking-wider">Infrazione</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-police-blue-dark dark:text-white uppercase tracking-wider">Multa ($)</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-police-blue-dark dark:text-white uppercase tracking-wider">Punti Patente</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-police-gray dark:divide-gray-600">
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Eccesso di velocità (10-30 km/h)</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">500</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">2</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Eccesso di velocità (oltre 30 km/h)</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">1000</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">4</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Passaggio con semaforo rosso</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">800</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">3</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Guida in stato di ebbrezza</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">1500</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">10</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Utilizzo del cellulare alla guida</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">300</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">2</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Mancato utilizzo delle cinture</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">200</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">1</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Sosta in divieto</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">150</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">0</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Guida senza patente</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">2000</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">N/A</td>
                </tr>
              </tbody>
            </table>
          </div>
        `
      }
    ],
    'codice-penale': [
      {
        title: 'Reati e Pene',
        content: `
          <h3 class="text-lg font-semibold mb-3">Reati e Relative Pene</h3>
          <p class="mb-4">La seguente tabella riporta i principali reati e le relative sanzioni previste:</p>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-police-gray dark:divide-gray-600">
              <thead class="bg-police-gray-light dark:bg-gray-700">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-police-blue-dark dark:text-white uppercase tracking-wider">Reato</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-police-blue-dark dark:text-white uppercase tracking-wider">Multa ($)</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-police-blue-dark dark:text-white uppercase tracking-wider">Mesi di Reclusione</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-police-gray dark:divide-gray-600">
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Rapina a mano armata</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">5000</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">20</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Furto</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">1500</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">8</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Aggressione</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">2000</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">10</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Possesso di sostanze stupefacenti</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">2500</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">12</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Resistenza all'arresto</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">1800</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">7</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Oltraggio a pubblico ufficiale</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">1000</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">5</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Omicidio</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">15000</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">35</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Tentato omicidio</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">10000</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">25</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Violazione di domicilio</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">2000</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">8</td>
                </tr>
                <tr class="hover:bg-police-gray-light dark:hover:bg-gray-700">
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">Furto d'auto</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">4000</td>
                  <td class="px-4 py-2 whitespace-nowrap text-police-blue-dark dark:text-white">12</td>
                </tr>
              </tbody>
            </table>
          </div>
        `
      }
    ]
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const filteredSections = searchQuery 
    ? Object.entries(codeContent).reduce((acc: any, [sectionId, topics]: any) => {
        const filteredTopics = topics.filter((topic: any) => 
          topic.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          topic.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredTopics.length > 0) {
          acc[sectionId] = filteredTopics;
        }
        return acc;
      }, {})
    : codeContent;

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
              Codici e Procedure
            </h1>
            <p className="text-police-gray-dark dark:text-police-text-muted mt-1">
              Consultazione di codici, procedure e regolamenti operativi
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 w-full md:w-64">
            <SearchInput onSearch={handleSearch} placeholder="Cerca nei codici..." />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-4">
            <h3 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Indice
            </h3>
            
            <div className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-police-blue text-white dark:bg-police-blue-dark'
                      : 'text-police-gray-dark dark:text-police-text-muted hover:bg-police-gray-light dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="flex items-center">
                    {section.icon}
                    <span className="ml-2">{section.title}</span>
                  </span>
                  <ChevronRight className={`h-4 w-4 ${activeSection === section.id ? 'text-white' : 'text-police-gray-dark'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
            {searchQuery ? (
              <div>
                <h2 className="text-xl font-bold text-police-blue-dark dark:text-police-text-light mb-4">
                  Risultati di ricerca per: "{searchQuery}"
                </h2>
                
                {Object.keys(filteredSections).length > 0 ? (
                  Object.entries(filteredSections).map(([sectionId, topics]: any) => (
                    <div key={sectionId} className="mb-8">
                      <h3 className="text-lg font-medium text-police-blue-dark dark:text-police-text-light mb-3">
                        {sections.find(s => s.id === sectionId)?.title}
                      </h3>
                      
                      <div className="space-y-6">
                        {topics.map((topic: any, index: number) => (
                          <div key={index} className="border-l-4 border-police-blue pl-4">
                            <h4 className="font-medium mb-2">{topic.title}</h4>
                            <div 
                              className="prose max-w-none dark:prose-invert" 
                              dangerouslySetInnerHTML={{ __html: topic.content }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8">
                    <Search className="h-12 w-12 text-police-gray-dark dark:text-police-text-muted mx-auto mb-3" />
                    <p className="text-police-gray-dark dark:text-police-text-muted">
                      Nessun risultato trovato per "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-police-blue-dark dark:text-police-text-light mb-4">
                  {sections.find(s => s.id === activeSection)?.title}
                </h2>
                
                <div className="space-y-8">
                  {codeContent[activeSection as keyof typeof codeContent]?.map((topic, index) => (
                    <div key={index} className="border-b border-police-gray pb-6 last:border-0">
                      <h3 className="text-lg font-medium text-police-blue-dark dark:text-police-text-light mb-3">{topic.title}</h3>
                      <div 
                        className="prose max-w-none dark:prose-invert" 
                        dangerouslySetInnerHTML={{ __html: topic.content }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
