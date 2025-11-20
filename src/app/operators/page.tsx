'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Link from 'next/link';
import { useConfig } from '../../hooks/useConfig';
import { User, Mail, Shield, Filter, UserPlus, Clock, PlusCircle, FileText, AlertCircle } from 'lucide-react';

// Interfaccia per gli operatori
interface Operator {
  id: string;
  name: string;
  surname: string;
  email: string;
  badge: string;
  department: string;
  rank: string;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Operators() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Utilizziamo i dipartimenti dalla configurazione
  const { departments: configDepartments, getDepartmentByName } = useConfig();
  
  // Array dei dipartimenti con l'opzione "tutti"
  const departments = [
    { id: 'all', name: 'Tutti i Dipartimenti', color: 'gray' },
    ...configDepartments.map(dept => ({
      id: dept.id,
      name: dept.name,
      color: dept.color
    }))
  ];
  
  // Carica gli operatori dal backend
  useEffect(() => {
    const fetchOperators = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/operators', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Errore nel caricamento degli operatori: ${response.statusText}`);
        }
        
        const data = await response.json();
        setOperators(data.operators);
      } catch (err: any) {
        console.error('Errore durante il caricamento degli operatori:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchOperators();
    }
  }, [status]);
  
  // Filtra operatori in base alla ricerca e al dipartimento
  const filteredOperators = operators.filter(operator => {
    const fullName = `${operator.name} ${operator.surname}`;
    const matchesSearch = 
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Se è selezionato "Tutti i dipartimenti", mostra tutti gli operatori che corrispondono alla ricerca
    if (departmentFilter === 'all') {
      return matchesSearch;
    }
    
    // Altrimenti filtra per dipartimento specifico
    const operatorDepartment = getDepartmentByName(operator.department);
    const operatorDeptId = operatorDepartment?.id || operator.department;
    
    const matchesDepartment = 
      operatorDeptId === departmentFilter || 
      operator.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleOperatorClick = (operator: Operator) => {
    router.push(`/operators/${operator.id}`);
  };

  // Formatta la data in un formato leggibile
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  };

  // Calcola la statistica degli operatori per dipartimento
  const operatorsByDepartment = operators.reduce((acc: {[key: string]: {count: number, name: string, id: string, color: string}}, op) => {
    const department = getDepartmentByName(op.department);
    
    if (department) {
      if (!acc[department.id]) {
        acc[department.id] = {
          count: 0,
          name: department.name,
          id: department.id,
          color: department.color
        };
      }
      acc[department.id].count += 1;
    } else {
      if (!acc[op.department]) {
        acc[op.department] = {
          count: 0,
          name: op.department,
          id: op.department,
          color: 'gray'
        };
      }
      acc[op.department].count += 1;
    }
    
    return acc;
  }, {});
  
  // Stato di caricamento
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-police-blue"></div>
        </div>
      </MainLayout>
    );
  }
  
  // Stato di errore
  if (error) {
    return (
      <MainLayout>
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 mb-4">
          <p className="font-semibold">Si è verificato un errore:</p>
          <p>{error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-police-blue-dark dark:text-police-text-light">
              Registro Operatori FDO
            </h1>
            <p className="text-police-gray-dark dark:text-gray-300 mt-1">
              Gestione degli operatori delle forze dell'ordine
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(operatorsByDepartment).map(([deptId, deptData]) => (
          <Card key={deptId} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={deptData.color as any || 'gray'}>
                  {deptData.name}
                </Badge>
                <p className="text-2xl font-bold mt-2 text-police-blue-dark dark:text-police-text-light">
                  {deptData.count}
                </p>
                <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                  operatori
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                deptData.name === 'Polizia' ? 'bg-blue-100 text-blue-600' : 
                deptData.name === 'Carabinieri' ? 'bg-red-100 text-red-600' : 
                deptData.name === 'Guardia di Finanza' ? 'bg-yellow-100 text-yellow-600' : 
                deptData.name === 'LSPD' ? 'bg-purple-100 text-purple-600' :
                deptData.name === 'Amministrazione' ? 'bg-green-100 text-green-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <Shield className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="green">
                Totale
              </Badge>
              <p className="text-2xl font-bold mt-2 text-police-blue-dark dark:text-police-text-light">
                {operators.length}
              </p>
              <p className="text-sm text-police-gray-dark dark:text-police-text-muted">
                operatori registrati
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="w-full md:w-64">
            <SearchInput onSearch={handleSearch} placeholder="Cerca operatore..." />
          </div>
          
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-police-gray-dark dark:text-police-text-muted mr-2" />
            <span className="text-sm text-police-gray-dark dark:text-police-text-muted mr-3">Filtra per:</span>
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="form-input text-sm border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-police-text-light rounded-md"
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      
      {filteredOperators.length > 0 ? (
        <>
          {/* Vista degli operatori divisi per dipartimento */}
          {departmentFilter === 'all' ? (
            // Implementazione completamente nuova per la visualizzazione di "tutti i dipartimenti"
            (() => {
              // Crea un oggetto per raggruppare gli operatori per dipartimento
              const deptGroups: {[key: string]: {department: any, operators: Operator[]}} = {};
              
              // Prima mappa gli operatori ai dipartimenti corrispondenti
              filteredOperators.forEach(op => {
                // Cerca nei dipartimenti configurati
                let found = false;
                
                // Controlla se l'operatore corrisponde a un dipartimento configurato
                for (const dept of configDepartments) {
                  if (op.department === dept.name) {
                    // Se trova corrispondenza, inizializza il gruppo se necessario
                    if (!deptGroups[dept.id]) {
                      deptGroups[dept.id] = {
                        department: dept,
                        operators: []
                      };
                    }
                    
                    // Aggiungi l'operatore al gruppo corrispondente
                    deptGroups[dept.id].operators.push(op);
                    found = true;
                    break;
                  }
                }
                
                // Se non trova corrispondenza, crea una categoria con il nome del dipartimento
                if (!found) {
                  const deptId = op.department.toLowerCase().replace(/\s+/g, '-');
                  if (!deptGroups[deptId]) {
                    deptGroups[deptId] = {
                      department: {
                        id: deptId,
                        name: op.department,
                        color: 'gray',
                        description: 'Dipartimento'
                      },
                      operators: []
                    };
                  }
                  deptGroups[deptId].operators.push(op);
                }
              });
              
              // Renderizza un elemento per ciascun gruppo
              return Object.values(deptGroups).map(group => {
                const { department: dept, operators: deptOperators } = group;
                
                return (
                  <Card key={dept.id} className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                        (() => {
                          switch(dept.color) {
                            case 'blue': return 'bg-blue-100 text-blue-600';
                            case 'red': return 'bg-red-100 text-red-600';
                            case 'green': return 'bg-green-100 text-green-600';
                            case 'yellow': return 'bg-yellow-100 text-yellow-600';
                            case 'purple': return 'bg-purple-100 text-purple-600';
                            case 'gold': return 'bg-yellow-100 text-yellow-600';
                            default: return 'bg-gray-100 text-gray-600';
                          }
                        })()
                      }`}>
                        <Shield className="h-5 w-5" />
                      </div>
                      <h2 className="text-xl font-semibold text-police-blue-dark dark:text-police-text-light">
                        {dept.name}
                      </h2>
                      <Badge variant={dept.color as any || 'gray'} className="ml-3">
                        {deptOperators.length} operatori
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deptOperators.map(operator => (
                        <div 
                          key={operator.id}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          onClick={() => handleOperatorClick(operator)}
                        >
                          <div className="flex items-center">
                            {operator.image ? (
                              <img 
                                src={operator.image} 
                                alt={`${operator.name} ${operator.surname}`}
                                className="h-12 w-12 rounded-full mr-3 object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-police-blue-light dark:bg-police-blue-dark flex items-center justify-center text-white font-medium mr-3">
                                {operator.name[0]}{operator.surname[0]}
                              </div>
                            )}
                            <div>
                              <div className="font-medium dark:text-police-text-light">{operator.name} {operator.surname}</div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="text-sm font-medium text-police-blue-dark dark:text-police-text-light">
                              {operator.rank}
                            </div>
                            <div className="flex items-center text-xs text-police-gray-dark dark:text-police-text-muted mt-1">
                              <Shield className="h-3 w-3 mr-1" />
                              Badge: {operator.badge}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center text-xs text-police-gray-dark dark:text-police-text-muted">
                              <Mail className="h-3 w-3 mr-1" />
                              {operator.email}
                            </div>
                            <Link href={`/reports?officerId=${operator.id}`}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs px-2 py-1"
                                leftIcon={<FileText className="h-3 w-3" />}
                              >
                                Denunce
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              });
            })()
          ) : (
            // Se è selezionato un dipartimento specifico, mostra solo gli operatori di quel dipartimento
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOperators.map(operator => (
                  <div 
                    key={operator.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleOperatorClick(operator)}
                  >
                    <div className="flex items-center">
                      {operator.image ? (
                        <img 
                          src={operator.image} 
                          alt={`${operator.name} ${operator.surname}`}
                          className="h-12 w-12 rounded-full mr-3 object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-police-blue-light dark:bg-police-blue-dark flex items-center justify-center text-white font-medium mr-3">
                          {operator.name[0]}{operator.surname[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium dark:text-police-text-light">{operator.name} {operator.surname}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-sm font-medium text-police-blue-dark dark:text-police-text-light">
                        {operator.rank}
                      </div>
                      <div className="flex items-center text-xs text-police-gray-dark dark:text-police-text-muted mt-1">
                        <Shield className="h-3 w-3 mr-1" />
                        Badge: {operator.badge}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center text-xs text-police-gray-dark dark:text-police-text-muted">
                        <Mail className="h-3 w-3 mr-1" />
                        {operator.email}
                      </div>
                      <Link href={`/reports?officerId=${operator.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs px-2 py-1"
                          leftIcon={<FileText className="h-3 w-3" />}
                        >
                          Denunce
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <div className="p-4 text-center">
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-10 w-10 text-police-gray" />
            </div>
            <p className="text-police-gray-dark dark:text-police-text-muted mb-2">
              Nessun operatore trovato con i filtri selezionati.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSearchQuery('');
                setDepartmentFilter('all');
              }}
            >
              Reimposta filtri
            </Button>
          </div>
        </Card>
      )}
    </MainLayout>
  );
}
