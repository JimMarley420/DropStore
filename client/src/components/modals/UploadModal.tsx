import React, { useState, useRef, useEffect } from "react";
import { useFileContext } from "@/context/FileContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatFileSize } from "@/lib/file-utils";
import { useToast } from "@/hooks/use-toast";
import { X, UploadCloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function UploadModal() {
  const { activeModal, setActiveModal, modalData } = useFileContext();
  const { toast } = useToast();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  
  // Initialize the upload files from modal data if available
  useEffect(() => {
    if (modalData?.files && Array.isArray(modalData.files)) {
      setUploadFiles(modalData.files.map((file: File) => ({
        file,
        progress: 0,
        status: 'pending'
      })));
    }
  }, [modalData]);

  // Handle file upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, folderId }: { file: File, folderId: number | null }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (folderId !== null) {
        formData.append("folderId", folderId.toString());
      }
      
      // We need to use fetch directly to track upload progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            // Update progress for this specific file
            setUploadFiles(prev => 
              prev.map(f => 
                f.file === file 
                  ? { ...f, progress, status: 'uploading' } 
                  : f
              )
            );
          }
        });
        
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error("Invalid response format"));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener("error", () => {
          reject(new Error("Network error occurred during upload"));
        });
        
        xhr.open("POST", "/api/files/upload");
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      if (modalData?.folderId) {
        queryClient.invalidateQueries({ queryKey: [`/api/folders/${modalData.folderId}/contents`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/folders/contents"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/user/storage"] });
    },
    onError: (error, variables) => {
      // Mark the file as failed
      setUploadFiles(prev => 
        prev.map(f => 
          f.file === variables.file 
            ? { ...f, status: 'error', error: error.message } 
            : f
        )
      );
      
      toast({
        title: "Upload failed",
        description: `Failed to upload ${variables.file.name}: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        progress: 0,
        status: 'pending' as const
      }));
      
      setUploadFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Handle file drop
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => ({
        file,
        progress: 0,
        status: 'pending' as const
      }));
      
      setUploadFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Remove a file from the upload list
  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Start uploading all files
  const startUpload = async () => {
    // Upload each file one by one
    for (const uploadFile of uploadFiles.filter(f => f.status === 'pending')) {
      try {
        await uploadFileMutation.mutateAsync({
          file: uploadFile.file,
          folderId: modalData?.folderId || null
        });
        
        // Mark as completed
        setUploadFiles(prev => 
          prev.map(f => 
            f.file === uploadFile.file 
              ? { ...f, progress: 100, status: 'success' } 
              : f
          )
        );
      } catch (error) {
        // Error is handled in the mutation
      }
    }
    
    // Show success message
    const successCount = uploadFiles.filter(f => f.status === 'success').length;
    if (successCount > 0) {
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${successCount} file${successCount !== 1 ? 's' : ''}.`,
      });
      
      // Close the modal if all files were uploaded successfully
      if (successCount === uploadFiles.length) {
        setActiveModal(null);
      }
    }
  };

  // Check if all files have been processed (success or error)
  const allFilesProcessed = uploadFiles.every(f => f.status === 'success' || f.status === 'error');
  
  // Count files by status
  const pendingFiles = uploadFiles.filter(f => f.status === 'pending').length;
  const uploadingFiles = uploadFiles.filter(f => f.status === 'uploading').length;
  const successFiles = uploadFiles.filter(f => f.status === 'success').length;
  const errorFiles = uploadFiles.filter(f => f.status === 'error').length;

  return (
    <Dialog 
      open={activeModal === "upload"} 
      onOpenChange={(open) => !open && setActiveModal(null)}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Télécharger des fichiers</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto py-4">
          {/* Drop Zone */}
          <div 
            ref={dropzoneRef}
            className={`border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-800/40 mb-6 transition-all ${isDragging ? 'border-blue-500 bg-blue-900/20' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
          >
            <div className="text-4xl text-blue-400 mb-3">
              <UploadCloud className="h-12 w-12 mx-auto floating-element" />
            </div>
            <h3 className="text-lg font-medium text-blue-300 mb-2 text-glow">Déposez vos fichiers ici</h3>
            <p className="text-gray-300 mb-4 text-center">ou</p>
            <Button 
              className="gradient-button hover-float"
              onClick={() => fileInputRef.current?.click()}
            >
              Parcourir
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleFileSelect}
              />
            </Button>
            <p className="mt-3 text-sm text-gray-400">Taille maximale: 10 Go</p>
          </div>
          
          {/* Upload List */}
          {uploadFiles.length > 0 && (
            <div className="border border-gray-700/50 rounded-lg overflow-hidden bg-gray-800/50">
              <div className="px-4 py-3 bg-gray-800/70 border-b border-gray-700/50 font-medium text-gray-200 flex justify-between items-center">
                <span>Fichiers à télécharger</span>
                <span className="text-sm">
                  {successFiles > 0 && <span className="text-green-500 mr-2">{successFiles} complété(s)</span>}
                  {errorFiles > 0 && <span className="text-red-500 mr-2">{errorFiles} échoué(s)</span>}
                  {(pendingFiles > 0 || uploadingFiles > 0) && (
                    <span className="text-blue-300">{pendingFiles + uploadingFiles} en attente</span>
                  )}
                </span>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {uploadFiles.map((uploadFile, index) => {
                  // Determine file icon and color
                  let iconClass = "ri-file-fill";
                  let iconColor = "text-neutral-400";
                  
                  if (uploadFile.file.type.includes('word')) {
                    iconClass = "ri-file-word-fill";
                    iconColor = "text-blue-500";
                  } else if (uploadFile.file.type.includes('excel') || uploadFile.file.type.includes('sheet')) {
                    iconClass = "ri-file-excel-fill";
                    iconColor = "text-green-500";
                  } else if (uploadFile.file.type.includes('pdf')) {
                    iconClass = "ri-file-pdf-fill";
                    iconColor = "text-red-500";
                  } else if (uploadFile.file.type.includes('powerpoint') || uploadFile.file.type.includes('presentation')) {
                    iconClass = "ri-file-ppt-fill";
                    iconColor = "text-orange-500";
                  } else if (uploadFile.file.type.includes('video')) {
                    iconClass = "ri-video-fill";
                    iconColor = "text-purple-500";
                  } else if (uploadFile.file.type.includes('audio')) {
                    iconClass = "ri-music-fill";
                    iconColor = "text-yellow-500";
                  }
                  
                  return (
                    <div 
                      key={index} 
                      className="px-4 py-3 border-b border-neutral-200 flex items-center"
                    >
                      <div className={`text-xl mr-3 ${iconColor}`}>
                        <i className={iconClass}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="pr-2">
                            <div className="font-medium text-sm text-neutral-800 truncate">
                              {uploadFile.file.name}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              {formatFileSize(uploadFile.file.size)}
                            </div>
                          </div>
                          {uploadFile.status === 'pending' && (
                            <button 
                              onClick={() => removeUploadFile(index)} 
                              className="text-neutral-400 hover:text-neutral-600"
                            >
                              <X size={16} />
                            </button>
                          )}
                          {uploadFile.status === 'success' && (
                            <div className="text-green-500">
                              <i className="ri-check-line"></i>
                            </div>
                          )}
                          {uploadFile.status === 'error' && (
                            <div className="text-red-500" title={uploadFile.error}>
                              <i className="ri-error-warning-line"></i>
                            </div>
                          )}
                        </div>
                        
                        {/* Progress */}
                        <Progress 
                          value={uploadFile.progress} 
                          className="h-1.5 mt-2"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-3">
          <Button 
            variant="outline" 
            onClick={() => setActiveModal(null)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Annuler
          </Button>
          <Button 
            className="gradient-button"
            onClick={startUpload}
            disabled={uploadFiles.length === 0 || uploadFiles.every(f => f.status !== 'pending') || uploadFileMutation.isPending}
          >
            {uploadFileMutation.isPending ? 'En cours...' : allFilesProcessed ? 'Terminé' : 'Télécharger'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
