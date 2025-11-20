'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [session, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-police-blue-light to-police-blue-dark">
      <div className="text-white text-center">
        <h1 className="text-3xl font-bold mb-2">Sistema FDO</h1>
        <p className="mb-4">Reindirizzamento in corso...</p>
        <p className="text-xs text-amber-300 mt-4">
          ⚠️ Sistema per uso videoludico/roleplay
        </p>
      </div>
    </div>
  );
}
