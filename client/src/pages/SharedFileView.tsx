import React, { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { File, Lock, Download, ArrowLeft, AlertCircle } from "lucide-react";
import { formatFileSize, formatDate, isImage, isVideo, isAudio, isDocument } from "@/lib/file-utils";
import { Loader2 } from "lucide-react";

export default function SharedFileView() {
  const [, params] = useRoute("/share/:token/file/:fileId");
  const token = params?.token || "";
  const fileId = params?.fileId ? parseInt(params.fileId) : 0;
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Extract password from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const urlPassword = urlParams.get("password");
  
  // Use password from URL if available
  React.useEffect(() => {
    if (urlPassword) {
      setPassword(urlPassword);
    }
  }, [urlPassword]);

  // Query shared file information
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/shares", token, fileId],
    queryFn: async () => {
      try {
        // First get the share information
        const shareResponse = await apiRequest(
          "GET", 
          `/api/shares/${token}${password ? `?password=${encodeURIComponent(password)}` : ""}`
        );
        const shareData = await shareResponse.json();
        
        // Then get the specific file from the share, if it's not the direct file
        if (shareData.item.id !== fileId) {
          const fileResponse = await apiRequest(
            "GET", 
            `/api/files/${fileId}?token=${token}${password ? `&password=${encodeURIComponent(password)}` : ""}`
          );
          const fileData = await fileResponse.json();
          return {
            share: shareData.share,
            item: fileData
          };
        }
        
        return shareData;
      } catch (error: any) {
        // Detect if password is required
        if (error.status === 401 && error.data?.passwordRequired) {
          setShowPasswordInput(true);
        }
        throw error;
      }
    },
    retry: false,
    enabled: !!token && !!fileId
  });

  // Handle password submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      setError("");
      refetch();
    } else {
      setError("Please enter the password");
    }
  };

  // Handle file download
  const handleDownload = async () => {
    if (!data?.item) return;
    
    try {
      const response = await fetch(`/api/files/${data.item.id}/content?token=${token}${password ? `&password=${encodeURIComponent(password)}` : ""}`);
      if (!response.ok) throw new Error("Failed to download file");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.item.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download the file. Please try again.");
    }
  };

  // Render file preview based on type
  const renderFilePreview = () => {
    if (!data?.item) return null;
    const file = data.item;
    
    // Create secure URL for file content
    const secureFileUrl = `/api/files/${file.id}/content?token=${token}${password ? `&password=${encodeURIComponent(password)}` : ""}`;
    
    if (isImage(file.type)) {
      return (
        <div className="mt-4 rounded-lg overflow-hidden border border-neutral-200 max-h-[500px] flex items-center justify-center bg-neutral-50">
          <img src={secureFileUrl} alt={file.name} className="max-w-full max-h-[500px] object-contain" />
        </div>
      );
    } else if (isVideo(file.type)) {
      return (
        <div className="mt-4 rounded-lg overflow-hidden border border-neutral-200">
          <video controls className="w-full">
            <source src={secureFileUrl} type={file.type} />
            Your browser does not support video playback.
          </video>
        </div>
      );
    } else if (isAudio(file.type)) {
      return (
        <div className="mt-4 rounded-lg border border-neutral-200 p-4 bg-neutral-50">
          <audio controls className="w-full">
            <source src={secureFileUrl} type={file.type} />
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    } else if (isDocument(file.type) && file.type.includes("pdf")) {
      return (
        <div className="mt-4 rounded-lg border border-neutral-200 h-[600px]">
          <iframe src={`${secureFileUrl}#toolbar=0`} width="100%" height="100%" className="rounded-lg"></iframe>
        </div>
      );
    } else {
      // Generic file icon for other types
      return (
        <div className="mt-6 flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50">
          <div className="text-4xl text-neutral-400 mb-4">
            <File size={64} />
          </div>
          <h3 className="text-lg font-medium mb-1">{file.name}</h3>
          <p className="text-sm text-neutral-500 mb-4">{formatFileSize(file.size)}</p>
        </div>
      );
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="mb-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Loading shared file...</h1>
        <p className="text-neutral-500">Please wait while we retrieve the file content</p>
      </div>
    );
  }

  // Password input form
  if (showPasswordInput) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-neutral-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center">
              <Lock className="mr-2 h-5 w-5 text-primary" />
              Password Protected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">This shared file is password protected</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">Unlock</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-neutral-50">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            This shared file is invalid, has expired, or requires a password.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Display shared file
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <File className="mr-2 h-5 w-5" />
              {data.item.name}
            </CardTitle>
            
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          <div className="text-sm text-neutral-500">
            {formatFileSize(data.item.size)} • 
            {formatDate(data.item.createdAt)} • 
            {data.item.type}
          </div>
        </CardHeader>
        
        <CardContent>
          {renderFilePreview()}
          
          {data.share.expiresAt && (
            <div className="mt-4 text-sm text-neutral-500">
              This link will expire on {formatDate(data.share.expiresAt)}
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = `/share/${token}${password ? `?password=${encodeURIComponent(password)}` : ""}`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to shared folder
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}