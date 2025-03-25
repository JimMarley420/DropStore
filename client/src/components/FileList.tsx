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
  Trash, 
  Download, 
  Share 
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
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-neutral-50 border-b border-neutral-200 font-medium text-neutral-700 text-sm">
        <div className="col-span-6 flex items-center">Name</div>
        <div className="col-span-2 hidden md:flex items-center">Size</div>
        <div className="col-span-3 md:col-span-2 flex items-center">Modified</div>
        <div className="col-span-3 md:col-span-2 flex items-center justify-end">Actions</div>
      </div>
      
      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-neutral-200 hover:bg-neutral-50 transition cursor-pointer"
          onClick={() => handleFolderClick(folder)}
          onContextMenu={(e) => handleContextMenu(e, "folder", folder)}
        >
          <div className="col-span-6 flex items-center">
            <div className="text-xl text-neutral-400 mr-3">
              <i className="ri-folder-fill"></i>
            </div>
            <div className="truncate">
              <span className="text-neutral-800">{folder.name}</span>
              <div className="text-xs text-neutral-500 mt-0.5">{folder.itemCount} items</div>
            </div>
          </div>
          <div className="col-span-2 hidden md:flex items-center text-neutral-600 text-sm">-</div>
          <div className="col-span-3 md:col-span-2 flex items-center text-neutral-600 text-sm">
            {formatDate(folder.updatedAt)}
          </div>
          <div className="col-span-3 md:col-span-2 flex items-center justify-end space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal("rename");
                setModalData({ id: folder.id, type: "folder", name: folder.name });
              }}
              className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-full"
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
              className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-full"
              title="Delete"
            >
              <Trash size={16} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-full"
                title="More options"
              >
                <MoreHorizontal size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal("share");
                    setModalData({ id: folder.id, type: "folder", name: folder.name });
                  }}
                >
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
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
      ))}
      
      {/* Files */}
      {files.map((file) => (
        <div
          key={file.id}
          className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-neutral-200 hover:bg-neutral-50 transition cursor-pointer"
          onClick={() => handleFileClick(file)}
          onContextMenu={(e) => handleContextMenu(e, "file", file)}
        >
          <div className="col-span-6 flex items-center">
            <div className={`text-xl mr-3 ${getFileIcon(file.type).color}`}>
              <i className={getFileIcon(file.type).icon}></i>
            </div>
            <div className="truncate">
              <span className="text-neutral-800">{file.name}</span>
              <div className="text-xs text-neutral-500 mt-0.5">{file.type}</div>
            </div>
          </div>
          <div className="col-span-2 hidden md:flex items-center text-neutral-600 text-sm">
            {formatFileSize(file.size)}
          </div>
          <div className="col-span-3 md:col-span-2 flex items-center text-neutral-600 text-sm">
            {formatDate(file.updatedAt)}
          </div>
          <div className="col-span-3 md:col-span-2 flex items-center justify-end space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`${file.url}?download=true`, '_blank');
              }}
              className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-full"
              title="Download"
            >
              <Download size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal("share");
                setModalData({ id: file.id, type: "file", name: file.name });
              }}
              className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-full"
              title="Share"
            >
              <Share size={16} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-full"
                title="More options"
              >
                <MoreHorizontal size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal("rename");
                    setModalData({ id: file.id, type: "file", name: file.name });
                  }}
                >
                  Rename
                </DropdownMenuItem>
                {section !== "trash" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(file);
                    }}
                  >
                    {file.favorite ? "Remove from favorites" : "Add to favorites"}
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
                    }}
                  >
                    Restore
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal("delete");
                    setModalData({ id: file.id, type: "file", name: file.name });
                  }}
                >
                  {section === "trash" ? "Delete permanently" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
