import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Home, Users, BookOpen, Shield, FileText, Search, AlertCircle, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePermissions, findRouteRules } from '@/contexts/PermissionsContext';
import { hasPermission } from '@/lib/permissions';

// Voci sempre visibili indipendentemente dai permessi configurati
const ALWAYS_VISIBLE = ['/dashboard'];

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Cittadini', href: '/citizens', icon: Users },
  { name: 'Operatori FDO', href: '/operators', icon: Shield },
  { name: 'Normative', href: '/normative', icon: BookOpen },
  { name: 'Sistema Arresti', href: '/arrests', icon: AlertCircle },
  { name: 'Denunce', href: '/reports', icon: FileText },
  { name: 'Ricercati', href: '/wanted', icon: Search },
  { name: "Porto d'Armi", href: '/weapon-licenses', icon: Target },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const { rules, loading: permLoading } = usePermissions();

  // Aspetta che ENTRAMBI siano pronti prima di filtrare, altrimenti si ottiene
  // un ciclo flash: mostra tutto → nasconde (permessi ok, sessione nulla) → rif
  const isLoading = permLoading || sessionStatus === 'loading';

  const isVisible = (href: string): boolean => {
    // Route sempre visibili
    if (ALWAYS_VISIBLE.some((r) => href === r || href.startsWith(r + '/'))) return true;
    // Durante il caricamento nasconde le voci ristrette per evitare flash
    if (isLoading) return false;
    // Nessuna regola configurata → accessibile a tutti
    const routeRules = findRouteRules(href, rules);
    if (!routeRules || routeRules.length === 0) return true;
    // Verifica permessi utente
    return hasPermission(
      { deptId: session?.user?.deptId ?? null, rankId: session?.user?.rankId ?? null },
      routeRules
    );
  };

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full w-64 bg-police-blue text-white flex flex-col"
    >
      <div className="p-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="bg-white p-3 rounded-full">
            <Shield className="h-8 w-8 text-police-blue" />
          </div>
          <h1 className="ml-3 text-xl font-bold">Sistema FDO</h1>
        </motion.div>
        
        <nav className="space-y-1">
          {sidebarItems.filter((item) => isVisible(item.href)).map((item) => {
            // Attivo anche sulle sotto-route (es. /arrests/123 → evidenzia "Sistema Arresti")
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center px-4 py-3 rounded-md transition-colors duration-200 ${
                  isActive 
                  ? 'bg-white/10 font-medium' 
                  : 'hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
                  />
                )}
                <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-white/70'}`} />
                <span className={isActive ? 'text-white' : 'text-white/70'}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.div>
  );
};

export default Sidebar;
