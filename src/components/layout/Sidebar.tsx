import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Users, BookOpen, Shield, FileText, Search, AlertCircle, Target
} from 'lucide-react';
import { motion } from 'framer-motion';

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Cittadini', href: '/citizens', icon: Users },
  { name: 'Operatori FDO', href: '/operators', icon: Shield },
  { name: 'Codici', href: '/codes', icon: BookOpen },
  { name: 'Sistema Arresti', href: '/arrests', icon: AlertCircle },
  { name: 'Denunce', href: '/reports', icon: FileText },
  { name: 'Ricercati', href: '/wanted', icon: Search },
  { name: 'Porto d\'Armi', href: '/weapon-licenses', icon: Target },
];

const Sidebar = () => {
  const pathname = usePathname();

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
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-md transition-colors duration-200 ${
                  isActive 
                  ? 'bg-white/10 font-medium' 
                  : 'hover:bg-white/5'
                }`}
              >
                <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-white/70'}`} />
                <span className={isActive ? 'text-white' : 'text-white/70'}>
                  {item.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.div>
  );
};

export default Sidebar;
