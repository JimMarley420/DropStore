import React from "react";
import { useLocation } from "wouter";
import { useFileContext } from "@/context/FileContext";
import { FileWithPath, FolderWithPath } from "@shared/schema";
import { formatFileSize, formatDate, getFileIcon } from "@/lib/file-utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Download, 
  Share,
  RefreshCw,
  Star,
  StarOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileListProps {
  folders: FolderWithPath[];
  files: FileWithPath[];
  section: string;
}

export default function FileList({ folders, files, section }: FileListProps) {
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

  return (
    <div className="border border-gray-800/50 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-900/50 border-b border-gray-800/50 font-medium text-gray-300 text-sm">
        <div className="col-span-6 flex items-center">Nom</div>
        <div className="col-span-2 hidden md:flex items-center">Taille</div>
        <div className="col-span-3 md:col-span-2 flex items-center">Modifié</div>
        <div className="col-span-3 md:col-span-2 flex items-center justify-end">Actions</div>
      </div>
      
      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer"
          onClick={() => handleFolderClick(folder)}
          onContextMenu={(e) => handleContextMenu(e, "folder", folder)}
        >
          <div className="col-span-6 flex items-center">
            <div className="text-xl text-blue-400 mr-3">
              <i className="ri-folder-fill"></i>
            </div>
            <div className="truncate">
              <span className="text-gray-300">{folder.name}</span>
              <div className="text-xs text-gray-500 mt-0.5">{folder.itemCount} éléments</div>
            </div>
          </div>
          <div className="col-span-2 hidden md:flex items-center text-gray-400 text-sm">-</div>
          <div className="col-span-3 md:col-span-2 flex items-center text-gray-400 text-sm">
            {formatDate(folder.updatedAt)}
          </div>
          <div className="col-span-3 md:col-span-2 flex items-center justify-end space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal("rename");
                setModalData({ id: folder.id, type: "folder", name: folder.name });
              }}
              className="p-1.5 text-gray-300 hover:bg-gray-700/50 rounded-full"
              title="Rename"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal("delete");
                setModalData({ id: folder.id, type: "folder", name: folder.name });
              }}
              className="p-1.5 text-gray-300 hover:bg-gray-700/50 rounded-full"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-gray-300 hover:bg-gray-700/50 rounded-full"
                title="More options"
              >
                <MoreHorizontal size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-gray-300">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal("share");
                    setModalData({ id: folder.id, type: "folder", name: folder.name });
                  }}
                  className="hover:bg-gray-700/50 focus:bg-gray-700/50"
                >
                  Partager
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700/50" />
                <DropdownMenuItem
                  className="text-red-400 hover:bg-gray-700/50 focus:bg-gray-700/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal("delete");
                    setModalData({ id: folder.id, type: "folder", name: folder.name });
                  }}
                >
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
      
      {/* Files */}
      {files.map((file) => (
        <div
          key={file.id}
          className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer"
          onClick={() => handleFileClick(file)}
          onContextMenu={(e) => handleContextMenu(e, "file", file)}
        >
          <div className="col-span-6 flex items-center">
            <div className={`text-xl mr-3 ${getFileIcon(file.type).color}`}>
              <i className={getFileIcon(file.type).icon}></i>
            </div>
            <div className="truncate">
              <span className="text-gray-300">{file.name}</span>
              <div className="text-xs text-gray-500 mt-0.5">{file.type}</div>
            </div>
          </div>
          <div className="col-span-2 hidden md:flex items-center text-gray-400 text-sm">
            {formatFileSize(file.size)}
          </div>
          <div className="col-span-3 md:col-span-2 flex items-center text-gray-400 text-sm">
            {formatDate(file.updatedAt)}
          </div>
          <div className="col-span-3 md:col-span-2 flex items-center justify-end space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`${file.url}?download=true`, '_blank');
              }}
              className="p-1.5 text-gray-300 hover:bg-gray-700/50 rounded-full"
              title="Télécharger"
            >
              <Download size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal("share");
                setModalData({ id: file.id, type: "file", name: file.name });
              }}
              className="p-1.5 text-gray-300 hover:bg-gray-700/50 rounded-full"
              title="Partager"
            >
              <Share size={16} />
            </button>
            {section !== "trash" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModal("delete");
                  setModalData({ id: file.id, type: "file", name: file.name, folderId: file.folderId });
                }}
                className="p-1.5 text-gray-300 hover:bg-gray-700/50 hover:text-red-400 rounded-full"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            )}
            {section === "trash" && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await apiRequest('POST', `/api/files/${file.id}/restore`, {});
                    queryClient.invalidateQueries({ queryKey: ['/api/trash'] });
                    toast({
                      title: "Fichier restauré",
                      description: `${file.name} a été restauré de la corbeille.`,
                    });
                  } catch (error) {
                    toast({
                      title: "Échec de la restauration",
                      description: "Impossible de restaurer le fichier. Veuillez réessayer.",
                      variant: "destructive",
                    });
                  }
                }}
                className="p-1.5 text-gray-300 hover:bg-gray-700/50 rounded-full"
                title="Restaurer"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-gray-300 hover:bg-gray-700/50 rounded-full"
                title="Plus d'options"
              >
                <MoreHorizontal size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-gray-300">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal("rename");
                    setModalData({ id: file.id, type: "file", name: file.name });
                  }}
                  className="hover:bg-gray-700/50 focus:bg-gray-700/50"
                >
                  Renommer
                </DropdownMenuItem>
                {section !== "trash" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(file);
                    }}
                    className="hover:bg-gray-700/50 focus:bg-gray-700/50"
                  >
                    {file.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  </DropdownMenuItem>
                )}
                {section === "trash" && (
                  <DropdownMenuItem
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await apiRequest('POST', `/api/files/${file.id}/restore`, {});
                        queryClient.invalidateQueries({ queryKey: ['/api/trash'] });
                        toast({
                          title: "Fichier restauré",
                          description: `${file.name} a été restauré de la corbeille.`,
                        });
                      } catch (error) {
                        toast({
                          title: "Échec de la restauration",
                          description: "Impossible de restaurer le fichier. Veuillez réessayer.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="hover:bg-gray-700/50 focus:bg-gray-700/50"
                  >
                    Restaurer
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-gray-700/50" />
                <DropdownMenuItem
                  className="text-red-400 hover:bg-gray-700/50 focus:bg-gray-700/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal("delete");
                    setModalData({ id: file.id, type: "file", name: file.name });
                  }}
                >
                  {section === "trash" ? "Supprimer définitivement" : "Supprimer"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
