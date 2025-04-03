import React from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useFileContext } from "@/context/FileContext";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StorageStats from "@/components/StorageStats";
import { 
  FolderIcon, 
  ClockIcon, 
  ShareIcon, 
  StarIcon, 
  TrashIcon, 
  UploadCloudIcon,
  User,
  ShieldCheck
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { setActiveModal, setModalData } = useFileContext();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  
  // Extract the current section from the location
  const section = location === "/" 
    ? "home" 
    : location.startsWith("/folder/") 
      ? "folder" 
      : location.slice(1);

  // Get user storage stats
  const { data: storageStats } = useQuery({
    queryKey: ["/api/user/storage"],
  });

  return (
    <aside className="hidden md:flex flex-col w-60 lg:w-72 border-r border-gray-700/50 gradient-card rounded-none py-4 overflow-y-auto scrollbar-thin">
      {/* Storage Overview */}
      <StorageStats />

      {/* Navigation Menu */}
      <nav className="flex-1">
        <ul>
          <li className="mb-1">
            <Link to="/">
              <div className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "home" 
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                  : "text-gray-300 hover:bg-gray-800/40"
              }`}>
                <FolderIcon className="mr-3 h-5 w-5" />
                My Files
              </div>
            </Link>
          </li>
          <li className="mb-1">
            <Link to="/recent">
              <div className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "recent" 
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                  : "text-gray-300 hover:bg-gray-800/40"
              }`}>
                <ClockIcon className="mr-3 h-5 w-5" />
                Recent
              </div>
            </Link>
          </li>
          <li className="mb-1">
            <Link to="/shared">
              <div className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "shared" 
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                  : "text-gray-300 hover:bg-gray-800/40"
              }`}>
                <ShareIcon className="mr-3 h-5 w-5" />
                Shared
              </div>
            </Link>
          </li>
          <li className="mb-1">
            <Link to="/favorites">
              <div className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "favorites" 
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                  : "text-gray-300 hover:bg-gray-800/40"
              }`}>
                <StarIcon className="mr-3 h-5 w-5" />
                Favorites
              </div>
            </Link>
          </li>
          <li className="mb-1">
            <Link to="/trash">
              <div className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "trash" 
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                  : "text-gray-300 hover:bg-gray-800/40"
              }`}>
                <TrashIcon className="mr-3 h-5 w-5" />
                Trash
              </div>
            </Link>
          </li>
        </ul>
        
        <div className="border-t border-gray-700/30 my-4"></div>
      </nav>
      
      {/* User Section */}
      <div className="border-t border-gray-700/30 my-4"></div>
      
      <div className="px-4 mb-2">
        <h3 className="text-xs uppercase text-blue-400 font-medium">Votre compte</h3>
      </div>
      
      <ul className="mb-3">
        <li className="mb-1">
          <Link to="/profile">
            <div className={`flex items-center px-4 py-2 rounded-md mx-2 ${
              section === "profile" 
                ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                : "text-gray-300 hover:bg-gray-800/40"
            }`}>
              <User className="mr-3 h-5 w-5 text-blue-400" />
              Profil
            </div>
          </Link>
        </li>
        
        {isAdmin && (
          <li className="mb-1">
            <Link to="/admin">
              <div className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "admin" 
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                  : "text-gray-300 hover:bg-gray-800/40"
              }`}>
                <ShieldCheck className="mr-3 h-5 w-5 text-green-400" />
                Administration
              </div>
            </Link>
          </li>
        )}
      </ul>
      
      {/* Upload Button */}
      <div className="px-4 mt-2">
        <Button 
          className="w-full gradient-button text-white"
          onClick={() => {
            setActiveModal("upload");
            setModalData(null);
          }}
        >
          <UploadCloudIcon className="mr-2 h-5 w-5" />
          Upload
        </Button>
      </div>
    </aside>
  );
}
