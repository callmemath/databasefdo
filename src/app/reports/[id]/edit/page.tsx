'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function ReportEditRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  useEffect(() => {
    // Redirect alla pagina dettagli con il parametro edit
    router.replace(`/reports/${id}?edit=true`);
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Caricamento...</span>
    </div>
  );
}
