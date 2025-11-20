import { useReportCategories } from '../hooks/useConfig';

// Tipi di denuncia configurabili
const defaultReportTypes = [
  { id: 'furto', name: 'Furto' },
  { id: 'violenza', name: 'Violenza o aggressione' },
  { id: 'disturbo', name: 'Disturbo della quiete' },
  { id: 'vandalismo', name: 'Vandalismo' },
  { id: 'truffa', name: 'Truffa' },
  { id: 'droga', name: 'Droga' },
  { id: 'altro', name: 'Altro' },
];

// Ottieni i tipi di denuncia dalla configurazione (supporta sia client che server)
export const getReportTypes = () => {
  try {
    // Verifica se siamo nel browser
    if (typeof window !== 'undefined') {
      const savedCategories = localStorage.getItem('fdo_report_categories');
      if (savedCategories) {
        try {
          const parsed = JSON.parse(savedCategories);
          return parsed.map((cat: any) => ({ id: cat.id, name: cat.name }));
        } catch (e) {
          console.error('Errore nel parsing delle categorie:', e);
        }
      }
    }
  } catch (e) {
    // Se c'è un errore (es. localStorage non disponibile), usiamo i valori predefiniti
  }
  
  return defaultReportTypes;
};

// Esporta i tipi di denuncia predefiniti per retrocompatibilità
export const reportTypes = defaultReportTypes;

// Definisci un tipo per i report types
interface ReportType {
  id: string;
  name: string;
}

// Ottieni il nome del tipo di denuncia dato l'id
export function getReportTypeName(typeId: string): string {
  const types = getReportTypes();
  const reportType = types.find((type: ReportType) => type.id === typeId);
  return reportType ? reportType.name : 'Sconosciuto';
}

// Hook per utilizzare i tipi di denuncia nel componente React
export function useReportTypes() {
  return useReportCategories();
}
