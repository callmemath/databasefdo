import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePermissions, findRouteRules } from '@/contexts/PermissionsContext';
import { hasPermission } from '@/lib/permissions';

// Sezioni sempre accessibili indipendentemente dalle regole configurate
const UNRESTRICTED_PREFIXES = ['/dashboard', '/config', '/admin', '/login'];

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { rules, loading: permLoading } = usePermissions();

  // Inizializza sidebarOpen in base alla dimensione dello schermo
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Controlla i permessi quando sessione e regole sono disponibili
  useEffect(() => {
    if (status !== 'authenticated' || permLoading) return;

    const isUnrestricted = UNRESTRICTED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    );
    if (isUnrestricted) return;

    const routeRules = findRouteRules(pathname, rules);
    if (!routeRules || routeRules.length === 0) return; // nessuna restrizione configurata

    const allowed = hasPermission(
      { deptId: session.user.deptId ?? null, rankId: session.user.rankId ?? null },
      routeRules
    );

    if (!allowed) {
      router.replace('/dashboard?error=unauthorized');
    }
  }, [status, permLoading, pathname, rules, session, router]);

  useEffect(() => {
    // Funzione per controllare se siamo su desktop
    const checkScreenSize = () => {
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint di Tailwind
      setSidebarOpen(isDesktop);
    };

    // Controlla all'avvio
    checkScreenSize();

    // Aggiungi listener per il resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-police-gray-light dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <div className={`hidden lg:block lg:flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0'}`}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75" onClick={toggleSidebar}></div>
      )}

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'transform-none' : '-translate-x-full'
      }`}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
