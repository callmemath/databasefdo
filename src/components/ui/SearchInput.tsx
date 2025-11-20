import { useState, useEffect, ChangeEvent, FormEvent, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  autoSearch?: boolean; // Se true, eseguirà la ricerca automaticamente durante la digitazione
  searchDelay?: number; // Ritardo in ms prima di eseguire la ricerca automatica
  minLength?: number; // Lunghezza minima per avviare la ricerca automatica
}

const SearchInput = ({ 
  onSearch, 
  placeholder = 'Cerca...', 
  className = '',
  value,
  onChange,
  autoSearch = false,
  searchDelay = 300,
  minLength = 3
}: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const controlled = value !== undefined;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ricorda l'ultima query inviata per evitare ricerche duplicate
  const lastSearchRef = useRef<string>('');
  const pendingSearchRef = useRef<string | null>(null);
  
  // Implementazione debounce come funzione separata per maggiore chiarezza
  const debouncedSearch = useCallback((searchTerm: string) => {
    // Cancella qualsiasi timer precedente
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    const trimmedValue = searchTerm.trim();
    
    // Salva il valore corrente come ricerca in attesa
    pendingSearchRef.current = trimmedValue;
    
    // Se il valore è abbastanza lungo, programma la ricerca
    if (trimmedValue.length >= minLength) {
      // Evita di inviare la stessa query due volte consecutive
      if (trimmedValue !== lastSearchRef.current) {
        console.log(`Programmazione ricerca per "${trimmedValue}" tra ${searchDelay}ms`);
        
        timerRef.current = setTimeout(() => {
          // Verifica che la ricerca sia ancora rilevante
          if (pendingSearchRef.current === trimmedValue) {
            console.log(`Esecuzione ricerca per "${trimmedValue}"`);
            onSearch(trimmedValue);
            lastSearchRef.current = trimmedValue;
            pendingSearchRef.current = null;
          } else {
            console.log(`Ricerca per "${trimmedValue}" annullata, nuova ricerca in corso: "${pendingSearchRef.current}"`);
          }
        }, searchDelay);
      } else {
        console.log(`Saltata ricerca per "${trimmedValue}" (identica all'ultima)`);
      }
    } else if (trimmedValue.length === 0 && lastSearchRef.current !== '') {
      // Clear search results immediately if the input is empty
      console.log('Svuotamento risultati di ricerca');
      onSearch('');
      lastSearchRef.current = '';
      pendingSearchRef.current = null;
    }
  }, [onSearch, searchDelay, minLength]);
  
  // Effettua la ricerca automatica quando il valore di input cambia
  useEffect(() => {
    if (autoSearch && controlled && value !== undefined) {
      debouncedSearch(value);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoSearch, value, controlled, debouncedSearch]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (controlled) {
      if (onChange) onChange(e);
    } else {
      setQuery(newValue);
      
      // Avvia la ricerca automatica per un componente non controllato
      if (autoSearch) {
        debouncedSearch(newValue);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const searchTerm = controlled ? value?.trim() : query.trim();
    if (searchTerm && searchTerm.length > 0) {
      onSearch(searchTerm);
    }
  };

  const clearSearch = () => {
    if (controlled) {
      if (onChange) {
        const event = {
          target: { value: '' }
        } as ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    } else {
      setQuery('');
    }
    onSearch('');
  };

  const currentValue = controlled ? value : query;
  
  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-police-gray-dark dark:text-police-text-muted" />
      </div>
      
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        className="form-input block w-full pl-10 pr-10 py-2 sm:text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md focus:ring-police-blue focus:border-police-blue dark:focus:ring-blue-500 dark:focus:border-blue-500"
        placeholder={placeholder}
      />
      
      {currentValue && currentValue.length > 0 && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute inset-y-0 right-8 flex items-center pr-1"
        >
          <X className="h-4 w-4 text-police-gray-dark dark:text-gray-400 hover:text-police-gray-darker dark:hover:text-gray-300 cursor-pointer" />
          <span className="sr-only">Cancella</span>
        </button>
      )}
      
      <button
        type="submit"
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
      >
        <span className="sr-only">Cerca</span>
      </button>
    </form>
  );
};

export default SearchInput;
