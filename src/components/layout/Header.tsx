import { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';

type HeaderProps = {
  toggleSidebar: () => void;
};

const Header = ({ toggleSidebar }: HeaderProps) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { data: session } = useSession();

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 shadow-sm z-10"
    >
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-police-gray-dark hover:text-police-blue hover:bg-police-gray-light focus:outline-none focus:ring-2 focus:ring-inset focus:ring-police-blue lg:hidden"
            >
              <span className="sr-only">Apri menu</span>
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
              <h2 className="text-xl font-bold text-police-blue-dark dark:text-police-text-light">
                Forze Dell'Ordine
              </h2>
            </div>
          </div>
          
          <div className="flex items-center">
            
            {/* Profile */}
            <div className="ml-4 relative flex-shrink-0">
              <div className="flex items-center">
                <div className="hidden md:block mr-3">
                  <p className="text-sm font-medium text-police-blue-dark dark:text-police-text-light">
                    {session?.user?.name || 'Utente'}
                  </p>
                  <p className="text-xs text-police-gray-dark dark:text-police-text-muted">
                    {session?.user?.department || 'Dipartimento'} • {session?.user?.rank || 'Rango'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)} 
                  className="bg-police-gray-light p-1 rounded-full text-police-gray-dark hover:text-police-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-police-blue"
                >
                  <span className="sr-only">Vedi profilo</span>
                  <div className="h-8 w-8 rounded-full bg-police-blue flex items-center justify-center text-white font-medium">
                    {session?.user?.name?.split(' ').map((n:string) => n[0]).join('') || 'U'}
                  </div>
                </button>
                
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    style={{ top: '100%' }}
                  >
                    <div className="py-1">
                      <button 
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-police-gray-light dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center">
                          <LogOut className="h-4 w-4 mr-2" />
                          <span>Logout</span>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
