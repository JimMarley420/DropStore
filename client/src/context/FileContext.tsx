import React, { createContext, useContext, useState } from "react";
import { 
  File as FileType, 
  Folder as FolderType,
  FileWithPath,
  FolderWithPath,
  FileAction 
} from "@shared/schema";

export type ViewMode = "grid" | "list";
export type SortBy = "name" | "modified" | "size" | "type";
export type FileTypeFilter = "all" | "image" | "document" | "video" | "audio" | "archive" | "other";

interface FileContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentPath: string;
  setCurrentPath: (path: string) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  fileTypeFilter: FileTypeFilter;
  setFileTypeFilter: (filter: FileTypeFilter) => void;
  selectedItems: Array<{ id: number; type: "file" | "folder" }>;
  setSelectedItems: (items: Array<{ id: number; type: "file" | "folder" }>) => void;
  contextMenuOpen: boolean;
  setContextMenuOpen: (open: boolean) => void;
  contextMenuPosition: { x: number; y: number };
  setContextMenuPosition: (position: { x: number; y: number }) => void;
  contextMenuTarget: { id: number; type: "file" | "folder" } | null;
  setContextMenuTarget: (target: { id: number; type: "file" | "folder" } | null) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  modalData: any;
  setModalData: (data: any) => void;
  previewFile: FileWithPath | null;
  setPreviewFile: (file: FileWithPath | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
  const [selectedItems, setSelectedItems] = useState<Array<{ id: number; type: "file" | "folder" }>>([]);
  const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [contextMenuTarget, setContextMenuTarget] = useState<{ id: number; type: "file" | "folder" } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [previewFile, setPreviewFile] = useState<FileWithPath | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
    <FileContext.Provider
      value={{
        viewMode,
        setViewMode,
        currentPath,
        setCurrentPath,
        sortBy,
        setSortBy,
        fileTypeFilter,
        setFileTypeFilter,
        selectedItems,
        setSelectedItems,
        contextMenuOpen,
        setContextMenuOpen,
        contextMenuPosition,
        setContextMenuPosition,
        contextMenuTarget,
        setContextMenuTarget,
        isDragging,
        setIsDragging,
        activeModal,
        setActiveModal,
        modalData,
        setModalData,
        previewFile,
        setPreviewFile,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = (): FileContextType => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFileContext must be used within a FileContextProvider");
  }
  return context;
};
