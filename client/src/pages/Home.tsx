import React, { useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import FileView from "@/pages/FileView";
import MobileNavigation from "@/components/MobileNavigation";
import MobileHeader from "@/components/MobileHeader";
import { useFileContext } from "@/context/FileContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UploadModal from "@/components/modals/UploadModal";
import NewFolderModal from "@/components/modals/NewFolderModal";
import RenameModal from "@/components/modals/RenameModal";
import DeleteModal from "@/components/modals/DeleteModal";
import ShareModal from "@/components/modals/ShareModal";
import FilePreviewModal from "@/components/modals/FilePreviewModal";

export default function Home() {
  const [match, params] = useRoute("/:section/:id?");
  const [, setLocation] = useLocation();
  const { setCurrentPath, activeModal } = useFileContext();

  // Get the current section and id from the URL
  const section = match ? params?.section || "home" : "home";
  const id = match ? params?.id : undefined;

  // Map the section to an API endpoint
  const getEndpoint = () => {
    switch (section) {
      case "folder":
        return `/api/folders/${id}/contents`;
      case "recent":
        return `/api/folders/contents?recent=true`;
      case "shared":
        return `/api/shares/me`;
      case "favorites":
        return `/api/folders/contents?favorite=true`;
      case "trash":
        return `/api/trash`;
      default:
        return `/api/folders/contents`;
    }
  };

  // Fetch data based on the current section
  const { data, isLoading, error } = useQuery<any>({
    queryKey: [getEndpoint()],
    enabled: section !== "search", // Don't fetch if we're on the search page
  });

  // Set the current path based on the section
  useEffect(() => {
    if (!match) {
      setCurrentPath("/");
    } else {
      switch (section) {
        case "folder":
          if (data && typeof data === 'object' && 'breadcrumbs' in data) {
            const breadcrumbs = data.breadcrumbs as Array<{id: number, name: string}>;
            setCurrentPath(breadcrumbs.map(b => b.name).join("/"));
          } else {
            setCurrentPath("/");
          }
          break;
        case "recent":
          setCurrentPath("/Recent");
          break;
        case "shared":
          setCurrentPath("/Shared");
          break;
        case "favorites":
          setCurrentPath("/Favorites");
          break;
        case "trash":
          setCurrentPath("/Trash");
          break;
        default:
          setCurrentPath("/");
      }
    }
  }, [match, section, data, setCurrentPath]);

  // Redirect to home if no match
  useEffect(() => {
    if (!match && section !== "home") {
      setLocation("/");
    }
  }, [match, section, setLocation]);

  // Fonction pour rafraîchir les données
  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [getEndpoint()] });
  }, [getEndpoint]);

  return (
    <div className="flex flex-col h-screen">
      {/* En-tête Mobile */}
      <MobileHeader refreshData={refreshData} />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden mobile-content">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="gradient-card rounded-none border-0 flex-1">
          <FileView 
            section={section} 
            folderId={id} 
            data={data} 
            isLoading={isLoading} 
            error={error} 
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Modals */}
      {activeModal === "upload" && <UploadModal />}
      {activeModal === "newFolder" && <NewFolderModal />}
      {activeModal === "rename" && <RenameModal />}
      {activeModal === "delete" && <DeleteModal />}
      {activeModal === "share" && <ShareModal />}
      {activeModal === "preview" && <FilePreviewModal />}
    </div>
  );
}
