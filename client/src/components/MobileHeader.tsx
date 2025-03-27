import React from "react";
import { useLocation, Link } from "wouter";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { useFileContext } from "@/context/FileContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, RefreshCw, Search, User, LogOut, Settings, ShieldCheck } from "lucide-react";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger 
} from "@/components/ui/sheet";

interface MobileHeaderProps {
  refreshData?: () => void;
}

export default function MobileHeader({ refreshData }: MobileHeaderProps) {
  const { user, logoutMutation } = useAuth();
  const isAdmin = useIsAdmin();
  const [location, setLocation] = useLocation();
  const { setActiveModal } = useFileContext();
  
  // Extraire le titre de la page à partir de l'URL
  const getPageTitle = () => {
    if (location === "/") return "Mes Fichiers";
    if (location.startsWith("/folder/")) return "Dossier";
    if (location === "/recent") return "Récents";
    if (location === "/shared") return "Partagés";
    if (location === "/favorites") return "Favoris";
    if (location === "/trash") return "Corbeille";
    return "DropStore";
  };
  
  // Obtenir les initiales de l'utilisateur pour l'avatar
  const getUserInitials = () => {
    if (!user) return "US";
    const fullName = user.fullName || user.username;
    return fullName
      .split(" ")
      .map(n => n[0])
      .join("")
      .substr(0, 2)
      .toUpperCase();
  };

  return (
    <div className="mobile-header">
      <div className="mobile-logo gradient-heading">
        <img src="/generated-icon.png" alt="DropStore" className="w-7 h-7 mr-2" />
        <span>{getPageTitle()}</span>
      </div>
      
      <div className="flex items-center space-x-3">
        {refreshData && (
          <button 
            onClick={refreshData}
            className="text-gray-300 hover:text-white p-1 rounded-full"
          >
            <RefreshCw size={20} />
          </button>
        )}
        
        <button 
          onClick={() => setActiveModal("search")}
          className="text-gray-300 hover:text-white p-1 rounded-full"
        >
          <Search size={20} />
        </button>
        
        <Sheet>
          <SheetTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer border border-gray-700/50 hover:border-blue-500/50 transition-colors">
              <AvatarImage src={user?.avatarUrl || undefined} alt={user?.username || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </SheetTrigger>
          <SheetContent className="border-l border-gray-700/50 bg-gray-900/95 backdrop-blur-lg">
            <SheetHeader>
              <SheetTitle className="text-blue-300">Menu utilisateur</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-800">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user?.avatarUrl || undefined} alt={user?.username || "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{user?.fullName || user?.username}</p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                </div>
              </div>
              
              <nav className="space-y-1">
                <Link href="/profile">
                  <a className="flex items-center py-2 px-3 rounded-md text-gray-200 hover:bg-gray-800">
                    <User size={18} className="mr-2 text-blue-400" />
                    Profil
                  </a>
                </Link>
                
                <Link href="/settings">
                  <a className="flex items-center py-2 px-3 rounded-md text-gray-200 hover:bg-gray-800">
                    <Settings size={18} className="mr-2 text-purple-400" />
                    Paramètres
                  </a>
                </Link>
                
                {isAdmin && (
                  <Link href="/admin">
                    <a className="flex items-center py-2 px-3 rounded-md text-gray-200 hover:bg-gray-800">
                      <ShieldCheck size={18} className="mr-2 text-green-400" />
                      Administration
                    </a>
                  </Link>
                )}
                
                <div className="pt-2 mt-2 border-t border-gray-800">
                  <button
                    className="w-full flex items-center py-2 px-3 rounded-md text-gray-200 hover:bg-gray-800"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut size={18} className="mr-2 text-red-400" />
                    Déconnexion
                  </button>
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}