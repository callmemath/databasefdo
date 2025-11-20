import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  cell?: (item: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  data?: T[];
  columns?: Column<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
  isLoading?: boolean;
  children?: ReactNode;
}

const Table = <T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  className = '',
  isLoading = false,
  children
}: TableProps<T>) => {
  // Gestisce rendering con children (per uso diretto di Header, Row, etc.)
  if (children) {
    return (
      <div className={`w-full overflow-x-auto rounded-lg shadow ${className}`}>
        <table className="min-w-full divide-y divide-police-gray dark:divide-gray-600">
          {children}
        </table>
      </div>
    );
  }
  
  // Gestione rendering basato sui dati
  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-police-gray rounded"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="h-12 bg-police-gray rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-police-gray-dark dark:text-gray-300">Nessun dato disponibile</p>
      </div>
    );
  }

  if (!columns) {
    return null;
  }

  return (
    <div className={`w-full overflow-x-auto rounded-lg shadow ${className}`}>
      <table className="min-w-full divide-y divide-police-gray dark:divide-gray-600">
        <thead className="bg-police-gray-light dark:bg-gray-700">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                className="px-6 py-3 text-left text-xs font-medium text-police-blue-dark dark:text-white uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-police-gray dark:divide-gray-600">
          {data.map((item, rowIdx) => (
            <tr
              key={rowIdx}
              className={`${
                onRowClick ? 'cursor-pointer hover:bg-police-gray-light dark:hover:bg-gray-700' : ''
              } transition-colors duration-200`}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((column, colIdx) => {
                const cellValue = column.cell 
                  ? column.cell(item)
                  : typeof column.accessor === 'function' 
                    ? column.accessor(item)
                    : item[column.accessor];
                
                return (
                  <td
                    key={colIdx}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-police-blue-dark dark:text-white ${
                      column.className || ''
                    }`}
                  >
                    {cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Componenti figli per l'uso diretto del Table
Table.Header = ({ children }: { children: ReactNode }) => {
  return (
    <thead className="bg-police-gray-light dark:bg-gray-700">
      {children}
    </thead>
  );
};

Table.Body = ({ children }: { children: ReactNode }) => {
  return (
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-police-gray dark:divide-gray-600">
      {children}
    </tbody>
  );
};

Table.Row = ({ children, onClick, className = '' }: { children: ReactNode, onClick?: () => void, className?: string }) => {
  return (
    <tr 
      className={`${
        onClick ? 'cursor-pointer hover:bg-police-gray-light dark:hover:bg-gray-700' : ''
      } transition-colors duration-200 ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

Table.Cell = ({ children, className = '' }: { children: ReactNode, className?: string }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-police-blue-dark dark:text-white ${className}`}>
      {children}
    </td>
  );
};

Table.HeaderCell = ({ children, className = '' }: { children: ReactNode, className?: string }) => {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-police-blue-dark dark:text-white uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
};

export default Table;
