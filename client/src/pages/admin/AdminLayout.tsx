import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  BarChart3, 
  Users, 
  Settings, 
  ShieldCheck, 
  FileText,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useWindowSize } from '@/lib/hooks';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { width } = useWindowSize();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = width < 1024;

  // Extraire la section active de l'URL
  const section = location.split('/')[2] || 'dashboard';

  // Fonction pour obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    if (!user) return 'AD';
    const fullName = user.fullName || user.username;
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .substr(0, 2)
      .toUpperCase();
  };

  // Ajouter une classe pour contrôler la visibilité de la sidebar sur mobile
  const sidebarClass = `
    h-screen fixed lg:static top-0 left-0 z-30 
    w-64 border-r border-gray-700/50 gradient-card rounded-none py-4 
    transition-transform duration-300 ease-in-out
    ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
  `;

  // Définir les éléments de navigation
  const navItems = [
    { name: 'Tableau de bord', icon: <BarChart3 size={20} />, path: '/admin' },
    { name: 'Utilisateurs', icon: <Users size={20} />, path: '/admin/users' },
    { name: 'Fichiers', icon: <FileText size={20} />, path: '/admin/files' },
    { name: 'Rôles & Permissions', icon: <ShieldCheck size={20} />, path: '/admin/roles' },
    { name: 'Paramètres', icon: <Settings size={20} />, path: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar pour la navigation admin */}
      <aside className={sidebarClass}>
        {isMobile && (
          <button 
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        )}
        
        {/* En-tête du sidebar */}
        <div className="px-6 mb-6">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.href = '/'}>
            <img src="/generated-icon.png" alt="DropStore" className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold gradient-heading">DropStore</h1>
              <p className="text-xs text-blue-400">Administration</p>
            </div>
          </div>
        </div>
        
        {/* Navigation principale */}
        <nav className="px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <a className={`flex items-center px-3 py-2 rounded-md ${
                    (section === 'dashboard' && item.path === '/admin') || 
                    (item.path !== '/admin' && item.path.includes(section))
                      ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium' 
                      : 'text-gray-300 hover:bg-gray-800/40'
                  }`}>
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.name}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Informations utilisateur */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/30">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatarUrl || undefined} alt={user?.username || "Admin"} />
              <AvatarFallback className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        {/* En-tête mobile avec bouton menu */}
        {isMobile && (
          <div className="sticky top-0 z-20 p-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 flex items-center">
            <button 
              className="text-gray-400 hover:text-white mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold gradient-heading">Administration</h1>
            </div>
          </div>
        )}
        
        {/* Titre de la page */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-gray-700/30 bg-gray-900/90 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center">
              <Link href="/admin">
                <a className="text-blue-400 hover:text-blue-300">Administration</a>
              </Link>
              <ChevronRight size={16} className="mx-2 text-gray-500" />
              <span className="text-gray-300">{title}</span>
            </div>
            <h1 className="text-2xl font-bold mt-2">{title}</h1>
            {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
          </div>
        </div>
        
        {/* Contenu de la page */}
        <div className="p-4 md:p-6 pb-24">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>
      
      {/* Overlay pour fermer le menu sur mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}