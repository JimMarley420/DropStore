import React from "react";
import { useLocation } from "wouter";
import { useFileContext } from "@/context/FileContext";
import { FileWithPath, FolderWithPath } from "@shared/schema";
import { formatFileSize, formatDate, getFileIcon } from "@/lib/file-utils";
import { MoreHorizontal, Download, Share, Star, StarOff, Trash2, RefreshCw } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileGridProps {
  folders: FolderWithPath[];
  files: FileWithPath[];
  section: string;
}

export default function FileGrid({ folders, files, section }: FileGridProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { 
    setActiveModal, 
    setModalData, 
    setPreviewFile, 
    setContextMenuOpen, 
    setContextMenuPosition, 
    setContextMenuTarget 
  } = useFileContext();

  // Open folder
  const handleFolderClick = (folder: FolderWithPath) => {
    setLocation(`/folder/${folder.id}`);
  };

  // Preview file
  const handleFileClick = (file: FileWithPath) => {
    setPreviewFile(file);
    setActiveModal("preview");
  };

  // Context menu
  const handleContextMenu = (e: React.MouseEvent, type: "file" | "folder", item: FileWithPath | FolderWithPath) => {
    e.preventDefault();
    setContextMenuOpen(true);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuTarget({ id: item.id, type });
  };

  // Download file
  const handleDownload = async (file: FileWithPath, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      window.open(`${file.url}?download=true`, '_blank');
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Share file
  const handleShare = (file: FileWithPath, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveModal("share");
    setModalData({ id: file.id, type: "file", name: file.name });
  };

  // Toggle favorite
  const toggleFavorite = async (file: FileWithPath, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiRequest('PATCH', `/api/files/${file.id}/favorite`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      toast({
        title: file.favorite ? "Removed from favorites" : "Added to favorites",
        description: `${file.name} has been ${file.favorite ? "removed from" : "added to"} your favorites.`,
      });
    } catch (error) {
      toast({
        title: "Action failed",
        description: "Could not update favorite status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Restore file from trash
  const handleRestore = async (file: FileWithPath, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiRequest('POST', `/api/files/${file.id}/restore`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/trash'] });
      toast({
        title: "File restored",
        description: `${file.name} has been restored from trash.`,
      });
    } catch (error) {
      toast({
        title: "Restore failed",
        description: "Could not restore the file. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Delete file
  const handleDelete = (file: FileWithPath, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveModal("delete");
    setModalData({ 
      id: file.id, 
      type: "file", 
      name: file.name,
      folderId: file.folderId 
    });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="group bg-gray-800/90 border border-gray-700/50 rounded-lg overflow-hidden hover:shadow-lg hover-float transition cursor-pointer backdrop-blur-sm"
          onClick={() => handleFolderClick(folder)}
          onContextMenu={(e) => handleContextMenu(e, "folder", folder)}
        >
          <div className="aspect-square bg-gray-900/60 flex items-center justify-center relative overflow-hidden">
            <div className="text-5xl text-blue-400">
              <i className="ri-folder-fill"></i>
            </div>
            
            {/* Quick Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 bg-gray-800 rounded-full shadow-md hover:bg-gray-700 text-gray-300"
                >
                  <MoreHorizontal size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-gray-200">
                  <DropdownMenuItem
                    className="hover:bg-gray-700 focus:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveModal("rename");
                      setModalData({ id: folder.id, type: "folder", name: folder.name });
                    }}
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="hover:bg-gray-700 focus:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveModal("share");
                      setModalData({ id: folder.id, type: "folder", name: folder.name });
                    }}
                  >
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30 focus:bg-red-900/30 focus:text-red-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveModal("delete");
                      setModalData({ id: folder.id, type: "folder", name: folder.name });
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-200 truncate">{folder.name}</h3>
            <p className="text-xs text-gray-400 mt-1">{folder.itemCount} items</p>
          </div>
        </div>
      ))}
      
      {/* Files */}
      {files.map((file) => (
        <div
          key={file.id}
          className="group bg-gray-800/90 border border-gray-700/50 rounded-lg overflow-hidden hover:shadow-lg hover-float transition cursor-pointer backdrop-blur-sm"
          onClick={() => handleFileClick(file)}
          onContextMenu={(e) => handleContextMenu(e, "file", file)}
        >
          <div className="aspect-square bg-gray-900/60 flex items-center justify-center relative overflow-hidden">
            {/* Preview Image */}
            {file && file.type && typeof file.type === 'string' && file.type.startsWith("image/") ? (
              <img 
                src={file.url} 
                alt={file.name} 
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/300?text=Image+Preview+Unavailable";
                }}
              />
            ) : (
              <div className={`text-5xl ${getFileIcon(typeof file?.type === 'string' ? file.type : '').color}`}>
                <i className={getFileIcon(typeof file?.type === 'string' ? file.type : '').icon}></i>
              </div>
            )}
            
            {/* Quick Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
              <button
                onClick={(e) => handleDownload(file, e)}
                className="p-1.5 bg-gray-800 rounded-full shadow-md hover:bg-gray-700 text-gray-300"
                title="Download"
              >
                <Download size={16} />
              </button>
              <button
                onClick={(e) => handleShare(file, e)}
                className="p-1.5 bg-gray-800 rounded-full shadow-md hover:bg-gray-700 text-gray-300"
                title="Share"
              >
                <Share size={16} />
              </button>
              {section === "trash" ? (
                <button
                  onClick={(e) => handleRestore(file, e)}
                  className="p-1.5 bg-gray-800 rounded-full shadow-md hover:bg-gray-700 text-gray-300"
                  title="Restore"
                >
                  <RefreshCw size={16} />
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => toggleFavorite(file, e)}
                    className="p-1.5 bg-gray-800 rounded-full shadow-md hover:bg-gray-700 text-gray-300"
                    title={file.favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    {file.favorite ? <StarOff size={16} /> : <Star size={16} />}
                  </button>
                  <button
                    onClick={(e) => handleDelete(file, e)}
                    className="p-1.5 bg-gray-800 rounded-full shadow-md hover:bg-gray-700 text-gray-300 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-200 truncate">{file.name}</h3>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
              <span className="text-xs text-gray-400">{file.updatedAt ? formatDate(file.updatedAt) : 'Unknown date'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
