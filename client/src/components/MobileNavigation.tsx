import React from "react";
import { Link, useLocation } from "wouter";
import { useFileContext } from "@/context/FileContext";
import { Button } from "@/components/ui/button";
import { FolderIcon, ClockIcon, ShareIcon, StarIcon, TrashIcon, PlusIcon } from "lucide-react";

export default function MobileNavigation() {
  const [location] = useLocation();
  const { setActiveModal, setModalData } = useFileContext();
  
  // Extract the current section from the location
  const section = location === "/" 
    ? "files" 
    : location.startsWith("/folder/") 
      ? "files" 
      : location.slice(1);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700/50 flex justify-around items-center py-2 z-10 gradient-card">
      <Link href="/">
        <a className={`flex flex-col items-center py-2 px-4 ${
          section === "files" ? "text-blue-400" : "text-gray-400"
        }`}>
          <FolderIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Fichiers</span>
        </a>
      </Link>
      
      <Link href="/recent">
        <a className={`flex flex-col items-center py-2 px-4 ${
          section === "recent" ? "text-blue-400" : "text-gray-400"
        }`}>
          <ClockIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Récents</span>
        </a>
      </Link>
      
      <button 
        onClick={() => {
          setActiveModal("upload");
          setModalData(null);
        }}
        className="flex flex-col items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full w-12 h-12 -mt-4 shadow-lg hover-float"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
      
      <Link href="/shared">
        <a className={`flex flex-col items-center py-2 px-4 ${
          section === "shared" ? "text-blue-400" : "text-gray-400"
        }`}>
          <ShareIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Partagés</span>
        </a>
      </Link>
      
      <Link href="/favorites">
        <a className={`flex flex-col items-center py-2 px-4 ${
          section === "favorites" ? "text-blue-400" : "text-gray-400"
        }`}>
          <StarIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Favoris</span>
        </a>
      </Link>
    </nav>
  );
}
