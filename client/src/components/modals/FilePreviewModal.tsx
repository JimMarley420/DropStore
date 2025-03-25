import React from "react";
import { useFileContext } from "@/context/FileContext";
import { formatFileSize, getFileIcon } from "@/lib/file-utils";
import { X, Download, Share, Star, StarOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function FilePreviewModal() {
  const { activeModal, setActiveModal, previewFile, setPreviewFile, setModalData } = useFileContext();
  const { toast } = useToast();

  // Handle close
  const handleClose = () => {
    setActiveModal(null);
    setPreviewFile(null);
  };

  // Handle download
  const handleDownload = () => {
    if (previewFile) {
      try {
        window.open(`${previewFile.url}?download=true`, '_blank');
      } catch (error) {
        toast({
          title: "Download failed",
          description: "Could not download the file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle share
  const handleShare = () => {
    if (previewFile) {
      setActiveModal("share");
      setModalData({ 
        id: previewFile.id, 
        type: "file", 
        name: previewFile.name 
      });
    }
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!previewFile) return;
    
    try {
      await apiRequest('PATCH', `/api/files/${previewFile.id}/favorite`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      toast({
        title: previewFile.favorite ? "Removed from favorites" : "Added to favorites",
        description: `${previewFile.name} has been ${previewFile.favorite ? "removed from" : "added to"} your favorites.`,
      });
      
      // Update the preview file
      setPreviewFile({
        ...previewFile,
        favorite: !previewFile.favorite
      });
    } catch (error) {
      toast({
        title: "Action failed",
        description: "Could not update favorite status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Determine preview content based on file type
  const renderPreview = () => {
    if (!previewFile) return null;
    
    if (previewFile.type.startsWith('image/')) {
      return (
        <img 
          src={previewFile.url} 
          alt={previewFile.name} 
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/500?text=Image+Preview+Unavailable";
          }}
        />
      );
    } else if (previewFile.type.includes('pdf')) {
      return (
        <iframe 
          src={previewFile.url} 
          className="w-full h-full bg-neutral-800"
          title={previewFile.name}
        ></iframe>
      );
    } else if (previewFile.type.includes('video')) {
      return (
        <video controls className="max-h-full max-w-full">
          <source src={previewFile.url} type={previewFile.type} />
          Your browser does not support video playback.
        </video>
      );
    } else if (previewFile.type.includes('audio')) {
      return (
        <div className="w-full max-w-xl p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center mb-6">
            <div className="text-5xl text-yellow-500 mr-4">
              <i className="ri-music-fill"></i>
            </div>
            <div>
              <h3 className="font-medium text-lg text-neutral-800">{previewFile.name}</h3>
              <p className="text-neutral-500 text-sm">{formatFileSize(previewFile.size)}</p>
            </div>
          </div>
          <audio controls className="w-full">
            <source src={previewFile.url} type={previewFile.type} />
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    } else {
      // Document/Other preview
      const fileIcon = getFileIcon(previewFile.type);
      return (
        <div className="flex flex-col items-center justify-center p-8 max-w-md text-center">
          <div className={`text-6xl mb-4 ${fileIcon.color}`}>
            <i className={fileIcon.icon}></i>
          </div>
          <h3 className="text-lg font-medium text-neutral-800 mb-2">{previewFile.name}</h3>
          <p className="text-neutral-600 mb-4">{formatFileSize(previewFile.size)}</p>
          <Button 
            variant="primary"
            onClick={handleDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      );
    }
  };

  return (
    <Dialog 
      open={activeModal === "preview" && previewFile !== null} 
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent className="max-w-6xl h-[80vh] p-0 flex flex-col">
        {/* Preview Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 flex justify-between items-center z-10">
          <div className="text-white">
            <h3 className="font-medium">{previewFile?.name}</h3>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="icon" 
              size="sm" 
              onClick={handleDownload}
              className="bg-white/20 text-white hover:bg-white/30 rounded-full backdrop-blur-sm"
              title="Download"
            >
              <Download size={16} />
            </Button>
            <Button 
              variant="icon" 
              size="sm" 
              onClick={handleShare}
              className="bg-white/20 text-white hover:bg-white/30 rounded-full backdrop-blur-sm"
              title="Share"
            >
              <Share size={16} />
            </Button>
            <Button 
              variant="icon" 
              size="sm" 
              onClick={toggleFavorite}
              className="bg-white/20 text-white hover:bg-white/30 rounded-full backdrop-blur-sm"
              title={previewFile?.favorite ? "Remove from favorites" : "Add to favorites"}
            >
              {previewFile?.favorite ? <StarOff size={16} /> : <Star size={16} />}
            </Button>
            <Button 
              variant="icon" 
              size="sm" 
              onClick={handleClose}
              className="bg-white/20 text-white hover:bg-white/30 rounded-full backdrop-blur-sm"
              title="Close"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="h-full flex items-center justify-center bg-neutral-100 p-4">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
