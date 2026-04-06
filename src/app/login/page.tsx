'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, User, Lock, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Inserisci email e password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });
      
      if (result?.error) {
        setError('Credenziali non valide');
        setIsLoading(false);
      } else if (result?.url) {
        router.push(result.url);
        router.refresh();
      }
    } catch (error) {
      setError('Si è verificato un errore durante il login');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-police-blue to-police-blue-dark flex flex-col justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-police-blue rounded-full p-4 mb-4">
            <Shield className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-police-blue-dark dark:text-white">Sistema FDO</h1>
          <p className="text-police-gray-dark dark:text-gray-300 mt-2">Accedi al Database delle Forze dell'Ordine</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
            ⚠️ Sistema per uso videoludico/roleplay - Dati fittizi
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-center text-red-800 dark:text-red-300">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-police-gray-dark dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-police-gray dark:text-gray-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-police-blue dark:focus:ring-blue-500 focus:border-police-blue dark:focus:border-blue-500 rounded-md"
                placeholder="email@fdo.it"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-police-gray-dark dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-police-gray dark:text-gray-500" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 border-police-gray dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-police-blue dark:focus:ring-blue-500 focus:border-police-blue dark:focus:border-blue-500 rounded-md"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Accesso in corso...' : 'Accedi'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-police-blue to-police-blue-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
