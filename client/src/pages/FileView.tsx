import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import SearchBar from "@/components/SearchBar";
import FileGrid from "@/components/FileGrid";
import FileList from "@/components/FileList";
import { useFileContext } from "@/context/FileContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileWithPath, FolderWithPath } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, FolderPlus, Grid, List, SortDesc, RefreshCw, Trash, UserIcon, LogOut, Image, FileText, Video, Music, Archive, File } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileViewProps {
  section: string;
  folderId?: string;
  data: any;
  isLoading: boolean;
  error: any;
}

export default function FileView({ section, folderId, data, isLoading, error }: FileViewProps) {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { 
    viewMode, 
    setViewMode, 
    setActiveModal, 
    setModalData, 
    sortBy, 
    setSortBy, 
    isDragging,
    setIsDragging,
    fileTypeFilter,
    setFileTypeFilter
  } = useFileContext();
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  
  // Générer les initiales pour l'avatar fallback
  const getInitials = () => {
    if (!user) return "?";
    if (user.fullName) {
      return user.fullName.split(" ").map(name => name[0]).join("").toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };
  
  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (id: number | null) => {
    if (id === null) {
      setLocation("/");
    } else {
      setLocation(`/folder/${id}`);
    }
  };

  // Handle file drop event
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Check if files were dropped
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setActiveModal("upload");
      setModalData({
        files: Array.from(e.dataTransfer.files),
        folderId: folderId ? parseInt(folderId) : null
      });
    }
  };

  // Sort and filter data based on the selected methods
  const sortedData = React.useMemo(() => {
    if (!data) return { folders: [], files: [] };
    
    const sortFolders = [...(data.folders || [])];
    let sortFiles = [...(data.files || [])];
    
    // Filter files by type if a filter is applied
    if (fileTypeFilter !== 'all') {
      sortFiles = sortFiles.filter(file => file.type === fileTypeFilter);
    }
    
    // Sort folders
    sortFolders.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "modified") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return 0;
    });
    
    // Sort files
    sortFiles.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "modified") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortBy === "size") {
        return b.size - a.size;
      } else if (sortBy === "type") {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });
    
    return { folders: sortFolders, files: sortFiles };
  }, [data, sortBy, fileTypeFilter]);

  return (
    <main 
      className="flex-1 overflow-y-auto" 
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
    >
      {/* Header with search and user info */}
      <header className="border-b border-gray-700/30 gradient-card rounded-none shadow-lg z-10 hidden md:block">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center hover-float">
            <div className="text-blue-400 text-3xl mr-2">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M12 2L20 8V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V8L12 2Z" 
                  stroke="url(#logo-gradient)" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M16 14C16 15.0609 15.5786 16.0783 14.8284 16.8284C14.0783 17.5786 13.0609 18 12 18C10.9391 18 9.92172 17.5786 9.17157 16.8284C8.42143 16.0783 8 15.0609 8 14" 
                  stroke="url(#logo-gradient)" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="logo-gradient" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="text-xl font-bold gradient-heading text-glow">DropStore</h1>
          </div>

          {/* Search */}
          <SearchBar />

          {/* User Actions */}
          <div className="flex items-center">
            <button className="p-2 rounded-full hover:bg-gray-800/40 transition-colors mr-2 relative" title="Notifications">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-gray-300">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>
            <div className="relative ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center hover-float">
                    <Avatar className="w-9 h-9 glowing-border">
                      <AvatarImage src={user?.avatarUrl || ""} alt={user?.username || "User"} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="gradient-card border-gray-700/50 p-1">
                  <DropdownMenuItem 
                    onClick={() => {
                      setActiveModal("profile");
                      setModalData({});
                    }}
                    className="text-gray-300 hover:bg-gray-800/60 cursor-pointer"
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      logoutMutation.mutate();
                    }}
                    className="text-red-400 hover:bg-gray-800/60 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb & Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-gray-700/30 gradient-card rounded-none shadow-md sticky top-0 z-10 md:top-0 top-14">
        <div className="flex items-center mb-3 sm:mb-0">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-1 text-sm">
            <button 
              onClick={() => handleBreadcrumbClick(null)} 
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover-float"
            >
              Accueil
            </button>
            
            {isLoading ? (
              <Skeleton className="h-4 w-24 bg-gray-700/50" />
            ) : data?.breadcrumbs && section === 'folder' ? (
              data.breadcrumbs.slice(1).map((crumb: any, index: number) => (
                <React.Fragment key={crumb.id}>
                  <span className="text-gray-500">/</span>
                  <button 
                    onClick={() => handleBreadcrumbClick(crumb.id)} 
                    className={`hover:text-blue-300 transition-colors hover-float ${
                      index === data.breadcrumbs.length - 2 ? "font-medium text-gray-200" : "text-blue-400"
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))
            ) : section !== 'home' ? (
              <>
                <span className="text-gray-500">/</span>
                <span className="font-medium text-gray-200">
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </span>
              </>
            ) : null}
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            className="border border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/30 hover-float"
            onClick={() => {
              if (section === 'folder' && folderId) {
                queryClient.invalidateQueries({ queryKey: [`/api/folders/${folderId}/contents`] });
              } else if (section === 'trash') {
                queryClient.invalidateQueries({ queryKey: ["/api/trash"] });
              } else {
                queryClient.invalidateQueries({ queryKey: ["/api/folders/contents"] });
              }
            }}
            title="Rafraîchir"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="ml-1 hidden sm:inline">Rafraîchir</span>
          </Button>
          
          {/* View Toggle */}
          <div className="border border-gray-700/50 rounded-lg flex bg-gray-900/30 backdrop-blur-sm shadow-inner overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 focus:ring-0 focus:ring-offset-0 ${
                viewMode === "grid" ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300" : "bg-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/30"
              } transition-all duration-300`}
              title="Vue en grille"
            >
              <Grid size={16} className="floating-element" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 focus:ring-0 focus:ring-offset-0 ${
                viewMode === "list" ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300" : "bg-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/30"
              } transition-all duration-300`}
              title="Vue en liste"
            >
              <List size={16} className="floating-element" />
            </Button>
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu open={sortMenuOpen} onOpenChange={setSortMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="border border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/30 hover-float"
                title="Trier"
              >
                <SortDesc size={16} className="mr-1" />
                <span className="ml-1 hidden sm:inline">Trier</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="gradient-card border-gray-700/50">
              <DropdownMenuItem 
                onClick={() => setSortBy("name")}
                className={sortBy === "name" ? "text-blue-400 font-medium" : "text-gray-300 hover:bg-gray-800/60"}
              >
                Nom
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("modified")}
                className={sortBy === "modified" ? "text-blue-400 font-medium" : "text-gray-300 hover:bg-gray-800/60"}
              >
                Date de modification
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("size")}
                className={sortBy === "size" ? "text-blue-400 font-medium" : "text-gray-300 hover:bg-gray-800/60"}
              >
                Taille
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("type")}
                className={sortBy === "type" ? "text-blue-400 font-medium" : "text-gray-300 hover:bg-gray-800/60"}
              >
                Type
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New Folder */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="border border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/30 hover-float"
            onClick={() => {
              setActiveModal("newFolder");
              setModalData({ folderId: folderId ? parseInt(folderId) : null });
            }}
          >
            <FolderPlus size={16} className="mr-1 text-blue-400" />
            <span className="ml-1 hidden sm:inline">Nouveau dossier</span>
          </Button>

          {/* Mobile Upload Button */}
          <Button 
            className="md:hidden gradient-button hover-float"
            size="sm"
            onClick={() => {
              setActiveModal("upload");
              setModalData({ folderId: folderId ? parseInt(folderId) : null });
            }}
          >
            <Upload size={16} />
          </Button>
        </div>
      </div>

      {/* File Drop Zone (always active but invisible until dragging) */}
      {isDragging && (
        <div 
          ref={dropzoneRef}
          className="dropzone p-6 m-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-500 bg-gray-900/60 backdrop-blur-lg transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
        >
          <div className="mb-4 floating-element">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M12 2L20 8V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V8L12 2Z" 
                stroke="url(#upload-gradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M12 15V9" 
                stroke="url(#upload-gradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M8 12L12 8L16 12" 
                stroke="url(#upload-gradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="upload-gradient" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3 className="text-xl font-medium text-blue-300 mb-2 text-glow">Déposez vos fichiers ici</h3>
          <p className="text-gray-300 mb-4 text-center">Les fichiers seront téléchargés dans le dossier actuel</p>
          <div className="w-full max-w-xs h-[1px] bg-gradient-to-r from-transparent via-gray-700 to-transparent my-4"></div>
          <Button 
            className="mt-2 gradient-button hover:scale-105 transition-transform"
            onClick={() => {
              setActiveModal("upload");
              setModalData({ folderId: folderId ? parseInt(folderId) : null });
            }}
          >
            Sélectionner des fichiers
          </Button>
        </div>
      )}
      
      {/* Type Filter Buttons */}
      <div className="px-6 pt-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            className={`border ${fileTypeFilter === 'all' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/30'} hover-float`}
            onClick={() => setFileTypeFilter('all')}
          >
            <File size={16} className="mr-2" />
            Tous les fichiers
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`border ${fileTypeFilter === 'image' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/30'} hover-float`}
            onClick={() => setFileTypeFilter('image')}
          >
            <Image size={16} className="mr-2 text-blue-400" />
            Images
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`border ${fileTypeFilter === 'document' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/30'} hover-float`}
            onClick={() => setFileTypeFilter('document')}
          >
            <FileText size={16} className="mr-2 text-green-400" />
            Documents
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`border ${fileTypeFilter === 'video' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/30'} hover-float`}
            onClick={() => setFileTypeFilter('video')}
          >
            <Video size={16} className="mr-2 text-red-400" />
            Vidéos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`border ${fileTypeFilter === 'audio' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/30'} hover-float`}
            onClick={() => setFileTypeFilter('audio')}
          >
            <Music size={16} className="mr-2 text-purple-400" />
            Audio
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`border ${fileTypeFilter === 'archive' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/30'} hover-float`}
            onClick={() => setFileTypeFilter('archive')}
          >
            <Archive size={16} className="mr-2 text-yellow-400" />
            Archives
          </Button>
        </div>
      </div>
      
      {/* Files and Folders Content */}
      <div className="px-6 pb-6">
        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="gradient-card rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-800/50"></div>
                <div className="p-3">
                  <div className="h-4 w-3/4 mb-2 bg-gray-700/70 rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-700/50 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl text-blue-500/30 mb-6 floating-element">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="url(#error-gradient)" strokeWidth="2" />
                <path d="M12 8V12" stroke="url(#error-gradient)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="url(#error-gradient)" />
                <defs>
                  <linearGradient id="error-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3 className="text-xl font-medium text-blue-300 mb-2 text-glow">Une erreur est survenue</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              {error.message || "Nous n'avons pas pu charger vos fichiers. Veuillez réessayer plus tard."}
            </p>
            <Button 
              className="gradient-button hover-float"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/folders"] })}
            >
              Réessayer
            </Button>
          </div>
        ) : sortedData.folders.length === 0 && sortedData.files.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl text-blue-500/30 mb-6 floating-element">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" 
                  stroke="url(#empty-gradient)" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="empty-gradient" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3 className="text-xl font-medium text-blue-300 mb-2 text-glow">Ce dossier est vide</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              Téléchargez des fichiers ou créez un nouveau dossier pour commencer à organiser vos documents.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                className="gradient-button hover-float"
                onClick={() => {
                  setActiveModal("upload");
                  setModalData({ folderId: folderId ? parseInt(folderId) : null });
                }}
              >
                <Upload size={16} className="mr-2" />
                Télécharger des fichiers
              </Button>
              <Button 
                variant="ghost"
                className="border border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/30 hover-float"
                onClick={() => {
                  setActiveModal("newFolder");
                  setModalData({ folderId: folderId ? parseInt(folderId) : null });
                }}
              >
                <FolderPlus size={16} className="mr-2 text-blue-400" />
                Nouveau dossier
              </Button>
            </div>
          </div>
        ) : (
          // Files and folders content
          viewMode === "grid" ? (
            <FileGrid 
              folders={sortedData.folders} 
              files={sortedData.files} 
              section={section}
            />
          ) : (
            <FileList 
              folders={sortedData.folders} 
              files={sortedData.files} 
              section={section}
            />
          )
        )}
      </div>
    </main>
  );
}
