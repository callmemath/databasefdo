import { useState, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';

interface Citizen {
  id: number;
  firstname: string;
  lastname: string;
  dateofbirth?: string;
  identifier?: string;
  sex?: string;
}

interface CitizenSelectorProps {
  selectedCitizen: Citizen | null;
  onSelectCitizen: (citizen: Citizen) => void;
  onClear?: () => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export default function CitizenSelector({
  selectedCitizen,
  onSelectCitizen,
  onClear,
  label = 'Cittadino',
  placeholder = 'Cerca cittadino per nome o cognome...',
  required = false,
}: CitizenSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Citizen[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/citizens?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data.citizens || []);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching citizens:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCitizen = (citizen: Citizen) => {
    onSelectCitizen(citizen);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    if (onClear) onClear();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Cittadino selezionato */}
      {selectedCitizen ? (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedCitizen.firstname} {selectedCitizen.lastname}
              </p>
              <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                {selectedCitizen.dateofbirth && (
                  <span>
                    Nato il: {new Date(selectedCitizen.dateofbirth).toLocaleDateString('it-IT')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        /* Campo di ricerca */
        <div className="relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={placeholder}
              required={required && !selectedCitizen}
            />
          </div>

          {/* Risultati della ricerca */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  Ricerca in corso...
                </div>
              ) : (
                searchResults.map((citizen) => (
                  <button
                    key={citizen.id}
                    type="button"
                    onClick={() => handleSelectCitizen(citizen)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {citizen.firstname} {citizen.lastname}
                        </p>
                        <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                          {citizen.dateofbirth && (
                            <span>
                              {new Date(citizen.dateofbirth).toLocaleDateString('it-IT')}
                            </span>
                          )}
                          {citizen.sex && <span>{citizen.sex === 'M' ? 'Maschio' : 'Femmina'}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Nessun risultato */}
          {showResults && !isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3 text-center text-gray-500 dark:text-gray-400">
              Nessun cittadino trovato
            </div>
          )}
        </div>
      )}
    </div>
  );
}
