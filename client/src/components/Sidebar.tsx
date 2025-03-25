import React from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useFileContext } from "@/context/FileContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StorageStats from "@/components/StorageStats";
import { 
  FolderIcon, 
  ClockIcon, 
  ShareIcon, 
  StarIcon, 
  TrashIcon, 
  ImageIcon, 
  FileTextIcon, 
  VideoIcon, 
  MusicIcon, 
  UploadCloudIcon 
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { setActiveModal, setModalData } = useFileContext();
  
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
            <Link href="/">
              <a className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "home" 
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                  : "text-gray-300 hover:bg-gray-800/40"
              }`}>
                <FolderIcon className="mr-3 h-5 w-5" />
                My Files
              </a>
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/recent">
              <a className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "recent" 
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                  : "text-gray-300 hover:bg-gray-800/40"
              }`}>
                <ClockIcon className="mr-3 h-5 w-5" />
                Recent
              </a>
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/shared">
              <a className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "shared" 
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                  : "text-gray-300 hover:bg-gray-800/40"
              }`}>
                <ShareIcon className="mr-3 h-5 w-5" />
                Shared
              </a>
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/favorites">
              <a className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "favorites" 
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                  : "text-gray-300 hover:bg-gray-800/40"
              }`}>
                <StarIcon className="mr-3 h-5 w-5" />
                Favorites
              </a>
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/trash">
              <a className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "trash" 
                  ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-medium" 
                  : "text-gray-300 hover:bg-gray-800/40"
              }`}>
                <TrashIcon className="mr-3 h-5 w-5" />
                Trash
              </a>
            </Link>
          </li>
        </ul>
        
        <div className="border-t border-gray-700/30 my-4"></div>
        
        {/* Quick Access Categories */}
        <div className="px-4 mb-2">
          <h3 className="text-xs uppercase text-blue-400 font-medium">Categories</h3>
        </div>
        <ul>
          <li className="mb-1">
            <a href="#" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800/40 rounded-md mx-2">
              <ImageIcon className="mr-3 h-5 w-5 text-blue-500" />
              Images
            </a>
          </li>
          <li className="mb-1">
            <a href="#" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800/40 rounded-md mx-2">
              <FileTextIcon className="mr-3 h-5 w-5 text-green-500" />
              Documents
            </a>
          </li>
          <li className="mb-1">
            <a href="#" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800/40 rounded-md mx-2">
              <VideoIcon className="mr-3 h-5 w-5 text-red-500" />
              Videos
            </a>
          </li>
          <li className="mb-1">
            <a href="#" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800/40 rounded-md mx-2">
              <MusicIcon className="mr-3 h-5 w-5 text-purple-500" />
              Audio
            </a>
          </li>
        </ul>
      </nav>
      
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
