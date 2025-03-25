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
    <aside className="hidden md:flex flex-col w-60 lg:w-72 border-r border-neutral-200 bg-white py-4 overflow-y-auto scrollbar-thin">
      {/* Storage Overview */}
      <StorageStats />

      {/* Navigation Menu */}
      <nav className="flex-1">
        <ul>
          <li className="mb-1">
            <Link href="/">
              <a className={`flex items-center px-4 py-2 rounded-md mx-2 ${
                section === "home" 
                  ? "text-primary-500 bg-primary-50 font-medium" 
                  : "text-neutral-700 hover:bg-neutral-100"
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
                  ? "text-primary-500 bg-primary-50 font-medium" 
                  : "text-neutral-700 hover:bg-neutral-100"
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
                  ? "text-primary-500 bg-primary-50 font-medium" 
                  : "text-neutral-700 hover:bg-neutral-100"
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
                  ? "text-primary-500 bg-primary-50 font-medium" 
                  : "text-neutral-700 hover:bg-neutral-100"
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
                  ? "text-primary-500 bg-primary-50 font-medium" 
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}>
                <TrashIcon className="mr-3 h-5 w-5" />
                Trash
              </a>
            </Link>
          </li>
        </ul>
        
        <div className="border-t border-neutral-200 my-4"></div>
        
        {/* Quick Access Categories */}
        <div className="px-4 mb-2">
          <h3 className="text-xs uppercase text-neutral-500 font-medium">Categories</h3>
        </div>
        <ul>
          <li className="mb-1">
            <a href="#" className="flex items-center px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-md mx-2">
              <ImageIcon className="mr-3 h-5 w-5 text-blue-500" />
              Images
            </a>
          </li>
          <li className="mb-1">
            <a href="#" className="flex items-center px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-md mx-2">
              <FileTextIcon className="mr-3 h-5 w-5 text-green-500" />
              Documents
            </a>
          </li>
          <li className="mb-1">
            <a href="#" className="flex items-center px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-md mx-2">
              <VideoIcon className="mr-3 h-5 w-5 text-red-500" />
              Videos
            </a>
          </li>
          <li className="mb-1">
            <a href="#" className="flex items-center px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-md mx-2">
              <MusicIcon className="mr-3 h-5 w-5 text-purple-500" />
              Audio
            </a>
          </li>
        </ul>
      </nav>
      
      {/* Upload Button */}
      <div className="px-4 mt-2">
        <Button 
          className="w-full bg-primary-500 hover:bg-primary-600 text-white"
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
