'use client';

import { memo } from 'react';
import Card from '../ui/Card';
import { Shield, FileText } from 'lucide-react';

interface ChartData {
  departmentArrestStats: { department: string; count: number }[];
  reportTypeStats: { type: string; count: number }[];
  monthlyArrestStats: { month: string; count: number }[];
}

interface DashboardChartsProps {
  data: ChartData;
}

const DashboardCharts = memo(function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <Card title="Statistiche Dipartimento" className="col-span-1">
      <div className="space-y-4">
        <div className="text-sm font-semibold text-police-gray-dark dark:text-gray-400 mb-2">
          Arresti per Dipartimento
        </div>
        
        {data.departmentArrestStats && data.departmentArrestStats.length > 0 ? (
          data.departmentArrestStats.map((stat, index) => (
            <div key={`dept-${index}`} className="flex items-center">
              <Shield className="h-4 w-4 text-police-blue dark:text-blue-400 mr-2" />
              <span className="text-sm dark:text-gray-300">{stat.department}</span>
              <span className="ml-auto text-sm font-medium dark:text-white">{stat.count}</span>
            </div>
          ))
        ) : (
          <div className="text-center py-3">
            <p className="text-police-gray-dark dark:text-police-text-muted">
              Nessun dato disponibile.
            </p>
          </div>
        )}
        
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
          <div className="text-sm font-semibold text-police-gray-dark dark:text-gray-400 mb-2">
            Denunce per Categoria
          </div>
          
          {data.reportTypeStats && data.reportTypeStats.length > 0 ? (
            data.reportTypeStats.map((stat, index) => (
              <div key={`type-${index}`} className="flex items-center">
                <FileText className="h-4 w-4 text-police-blue dark:text-blue-400 mr-2" />
                <span className="text-sm dark:text-gray-300">{stat.type}</span>
                <span className="ml-auto text-sm font-medium dark:text-white">{stat.count}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-3">
              <p className="text-police-gray-dark dark:text-police-text-muted">
                Nessun dato disponibile.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

export default DashboardCharts;
