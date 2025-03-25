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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around items-center py-2 z-10">
      <Link href="/">
        <a className={`flex flex-col items-center py-2 px-4 ${
          section === "files" ? "text-primary-500" : "text-neutral-600"
        }`}>
          <FolderIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Files</span>
        </a>
      </Link>
      
      <Link href="/recent">
        <a className={`flex flex-col items-center py-2 px-4 ${
          section === "recent" ? "text-primary-500" : "text-neutral-600"
        }`}>
          <ClockIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Recent</span>
        </a>
      </Link>
      
      <button 
        onClick={() => {
          setActiveModal("upload");
          setModalData(null);
        }}
        className="flex flex-col items-center justify-center bg-primary-500 text-white rounded-full w-12 h-12 -mt-4 shadow-lg"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
      
      <Link href="/shared">
        <a className={`flex flex-col items-center py-2 px-4 ${
          section === "shared" ? "text-primary-500" : "text-neutral-600"
        }`}>
          <ShareIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Shared</span>
        </a>
      </Link>
      
      <Link href="/favorites">
        <a className={`flex flex-col items-center py-2 px-4 ${
          section === "favorites" ? "text-primary-500" : "text-neutral-600"
        }`}>
          <StarIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Favorites</span>
        </a>
      </Link>
    </nav>
  );
}
