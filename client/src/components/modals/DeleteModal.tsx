import React from "react";
import { useFileContext } from "@/context/FileContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DeleteModal() {
  const { activeModal, setActiveModal, modalData } = useFileContext();
  const { toast } = useToast();
  
  const isTrash = window.location.pathname === "/trash";

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      // Determine the endpoint based on type and whether it's a permanent delete
      let endpoint = "";
      if (modalData?.type === "folder") {
        endpoint = `/api/folders/${modalData?.id}`;
      } else {
        endpoint = isTrash 
          ? `/api/files/${modalData?.id}/permanent` 
          : `/api/files/${modalData?.id}`;
      }
      
      return apiRequest("DELETE", endpoint, {});
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      if (isTrash) {
        queryClient.invalidateQueries({ queryKey: ["/api/trash"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
        if (modalData?.folderId) {
          queryClient.invalidateQueries({ queryKey: [`/api/folders/${modalData.folderId}/contents`] });
        } else {
          queryClient.invalidateQueries({ queryKey: ["/api/folders/contents"] });
        }
      }
      
      // Also update storage stats
      queryClient.invalidateQueries({ queryKey: ["/api/user/storage"] });
      
      toast({
        title: isTrash ? "Permanently deleted" : "Moved to trash",
        description: `${modalData?.name} has been ${isTrash ? "permanently deleted" : "moved to trash"}.`,
      });
      
      // Close the modal
      setActiveModal(null);
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Handle delete
  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Dialog 
      open={activeModal === "delete"} 
      onOpenChange={(open) => !open && setActiveModal(null)}
    >
      <DialogContent>
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <AlertTriangle size={48} />
          </div>
          <DialogTitle className="text-xl">
            {isTrash 
              ? `Permanently delete ${modalData?.type}?` 
              : `Delete ${modalData?.type}?`}
          </DialogTitle>
          <DialogDescription className="mt-2">
            {modalData?.type === "folder" 
              ? "This will delete the folder and all its contents." 
              : isTrash 
                ? "This file will be permanently deleted and cannot be recovered." 
                : "This file will be moved to trash and can be recovered within 30 days."}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-6">
          <Button 
            variant="outline" 
            onClick={() => setActiveModal(null)}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending 
              ? "Deleting..." 
              : isTrash 
                ? "Delete Permanently" 
                : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
