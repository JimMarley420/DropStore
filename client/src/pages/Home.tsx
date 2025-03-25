import React, { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import FileView from "@/pages/FileView";
import MobileNavigation from "@/components/MobileNavigation";
import { useFileContext } from "@/context/FileContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const { data, isLoading, error } = useQuery({
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
          if (data?.breadcrumbs) {
            setCurrentPath(data.breadcrumbs.map((b: any) => b.name).join("/"));
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

  return (
    <div className="flex flex-col h-screen bg-neutral-100">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <FileView 
          section={section} 
          folderId={id} 
          data={data} 
          isLoading={isLoading} 
          error={error} 
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Simple Footer */}
      <div className="w-full text-center py-2 text-xs text-gray-500 bg-white border-t">
        Développé par Jimmy Marley • <a href="https://discord.gg/ecwtNzYPSN" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Discord</a>
      </div>

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
