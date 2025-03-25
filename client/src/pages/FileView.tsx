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
import { Upload, FolderPlus, Grid, List, SortDesc } from "lucide-react";
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
  const { 
    viewMode, 
    setViewMode, 
    setActiveModal, 
    setModalData, 
    sortBy, 
    setSortBy, 
    isDragging,
    setIsDragging
  } = useFileContext();
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  
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

  // Sort data based on the selected sort method
  const sortedData = React.useMemo(() => {
    if (!data) return { folders: [], files: [] };
    
    const sortFolders = [...(data.folders || [])];
    const sortFiles = [...(data.files || [])];
    
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
  }, [data, sortBy]);

  return (
    <main 
      className="flex-1 overflow-y-auto bg-white" 
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
    >
      {/* Header with search and user info */}
      <header className="border-b border-neutral-200 bg-white shadow-sm z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-primary-500 text-3xl mr-2">
              <i className="ri-folder-cloud-line"></i>
            </div>
            <h1 className="text-xl font-bold text-neutral-800">DropStore</h1>
          </div>

          {/* Search */}
          <SearchBar />

          {/* User Actions */}
          <div className="flex items-center">
            <button className="p-2 rounded-full hover:bg-neutral-100 md:hidden mr-1" title="Search">
              <i className="ri-search-line text-neutral-600 text-xl"></i>
            </button>
            <button className="p-2 rounded-full hover:bg-neutral-100 mr-1" title="Notifications">
              <i className="ri-notification-3-line text-neutral-600 text-xl"></i>
            </button>
            <div className="relative ml-2">
              <button className="flex items-center">
                <img 
                  src="https://i.pravatar.cc/150?u=12345" 
                  alt="User avatar" 
                  className="w-9 h-9 rounded-full border-2 border-primary-500 object-cover" 
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb & Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="flex items-center mb-3 sm:mb-0">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-1 text-sm">
            <button 
              onClick={() => handleBreadcrumbClick(null)} 
              className="text-neutral-600 hover:text-primary-500"
            >
              Home
            </button>
            
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : data?.breadcrumbs && section === 'folder' ? (
              data.breadcrumbs.slice(1).map((crumb: any, index: number) => (
                <React.Fragment key={crumb.id}>
                  <span className="text-neutral-400">/</span>
                  <button 
                    onClick={() => handleBreadcrumbClick(crumb.id)} 
                    className={`hover:text-primary-500 ${
                      index === data.breadcrumbs.length - 2 ? "font-medium text-neutral-800" : "text-neutral-600"
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))
            ) : section !== 'home' ? (
              <>
                <span className="text-neutral-400">/</span>
                <span className="font-medium text-neutral-800">
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </span>
              </>
            ) : null}
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center">
          {/* View Toggle */}
          <div className="mr-2 border border-neutral-300 rounded-lg flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 focus:outline-none ${
                viewMode === "grid" ? "bg-neutral-100 text-neutral-800" : "bg-white text-neutral-600"
              }`}
              title="Grid view"
            >
              <Grid size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 focus:outline-none ${
                viewMode === "list" ? "bg-neutral-100 text-neutral-800" : "bg-white text-neutral-600"
              }`}
              title="List view"
            >
              <List size={16} />
            </Button>
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu open={sortMenuOpen} onOpenChange={setSortMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-2"
                title="Sort"
              >
                <SortDesc size={16} className="mr-1" />
                <span className="ml-1 hidden sm:inline">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setSortBy("name")}
                className={sortBy === "name" ? "text-primary-500 font-medium" : ""}
              >
                Name
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("modified")}
                className={sortBy === "modified" ? "text-primary-500 font-medium" : ""}
              >
                Date modified
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("size")}
                className={sortBy === "size" ? "text-primary-500 font-medium" : ""}
              >
                Size
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("type")}
                className={sortBy === "type" ? "text-primary-500 font-medium" : ""}
              >
                Type
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New Folder */}
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-2" 
            onClick={() => {
              setActiveModal("newFolder");
              setModalData({ folderId: folderId ? parseInt(folderId) : null });
            }}
          >
            <FolderPlus size={16} className="mr-1" />
            <span className="ml-1 hidden sm:inline">New folder</span>
          </Button>

          {/* Mobile Upload Button */}
          <Button 
            variant="primary" 
            size="sm" 
            className="md:hidden" 
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
          className="dropzone p-6 m-4 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-dashed border-primary-500 transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
        >
          <div className="text-5xl text-primary-500 mb-4">
            <i className="ri-upload-cloud-line"></i>
          </div>
          <h3 className="text-xl font-medium text-neutral-800 mb-2">Drop your files here</h3>
          <p className="text-neutral-600 mb-4 text-center">Files will be uploaded to the current folder</p>
          <p className="text-sm text-neutral-500">or</p>
          <Button 
            variant="primary" 
            className="mt-4"
            onClick={() => {
              setActiveModal("upload");
              setModalData({ folderId: folderId ? parseInt(folderId) : null });
            }}
          >
            Select files
          </Button>
        </div>
      )}
      
      {/* Files and Folders Content */}
      <div className="p-4">
        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="border border-neutral-200 rounded-lg overflow-hidden">
                <Skeleton className="aspect-square bg-neutral-100" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl text-neutral-300 mb-4">
              <i className="ri-error-warning-line"></i>
            </div>
            <h3 className="text-xl font-medium text-neutral-700 mb-2">Something went wrong</h3>
            <p className="text-neutral-500 mb-6 max-w-md">
              {error.message || "We couldn't load your files. Please try again later."}
            </p>
            <Button 
              variant="primary"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/folders"] })}
            >
              Try again
            </Button>
          </div>
        ) : sortedData.folders.length === 0 && sortedData.files.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl text-neutral-300 mb-4">
              <i className="ri-folder-open-line"></i>
            </div>
            <h3 className="text-xl font-medium text-neutral-700 mb-2">This folder is empty</h3>
            <p className="text-neutral-500 mb-6 max-w-md">
              Upload files or create a new folder to start organizing your documents.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button 
                variant="primary" 
                onClick={() => {
                  setActiveModal("upload");
                  setModalData({ folderId: folderId ? parseInt(folderId) : null });
                }}
              >
                <i className="ri-upload-cloud-line mr-1"></i>
                Upload files
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setActiveModal("newFolder");
                  setModalData({ folderId: folderId ? parseInt(folderId) : null });
                }}
              >
                <i className="ri-folder-add-line mr-1"></i>
                New folder
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
