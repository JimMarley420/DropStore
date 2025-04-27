import React, { useState } from "react";
import { useFileContext } from "@/context/FileContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Copy, Facebook, Twitter, Linkedin, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { shareFileSchema } from "@shared/schema";

export default function ShareModal() {
  const { activeModal, setActiveModal, modalData } = useFileContext();
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [useExpiration, setUseExpiration] = useState(false);

  // Create form with validation
  const form = useForm<z.infer<typeof shareFileSchema>>({
    resolver: zodResolver(shareFileSchema),
    defaultValues: {
      id: modalData?.id || 0,
      type: modalData?.type || "file",
      permission: "view",
    },
  });

  // Update form values when modalData changes
  React.useEffect(() => {
    if (modalData) {
      form.reset({
        id: modalData.id || 0,
        type: modalData.type || "file",
        permission: "view",
      });
    }
  }, [modalData, form]);

  // Create share mutation
  const createShareMutation = useMutation({
    mutationFn: async (values: z.infer<typeof shareFileSchema>) => {
      const response = await apiRequest("POST", "/api/shares", values);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Set the share URL from the response
      if (data && data.shareUrl) {
        setShareUrl(data.shareUrl);
        
        toast({
          title: "Share link created",
          description: "The share link has been created and copied to clipboard.",
        });
        
        // Copy to clipboard
        navigator.clipboard.writeText(data.shareUrl).catch(() => {
          // Clipboard write failed
          toast({
            title: "Copy failed",
            description: "Could not copy to clipboard. Please copy the link manually.",
            variant: "destructive",
          });
        });
      } else {
        console.error("Share URL is missing from response:", data);
        toast({
          title: "Share link issue",
          description: "The share link was created but the URL could not be generated properly.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create share link",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Copy share link
  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Share link has been copied to your clipboard.",
        });
      }).catch(() => {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard. Please copy the link manually.",
          variant: "destructive",
        });
      });
    }
  };

  // Form submission handler
  const onSubmit = (values: z.infer<typeof shareFileSchema>) => {
    // Add password and expiration if enabled
    if (usePassword) {
      values.password = form.getValues("password");
    }
    
    if (useExpiration) {
      values.expiresAt = form.getValues("expiresAt") as unknown as Date;
    }
    
    createShareMutation.mutate(values);
  };

  return (
    <Dialog 
      open={activeModal === "share"} 
      onOpenChange={(open) => !open && setActiveModal(null)}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
        </DialogHeader>
        
        {/* File Info */}
        {modalData && (
          <div className="flex items-center mb-6">
            <div className="text-2xl mr-4 text-neutral-400">
              {modalData.type === "folder" ? (
                <i className="ri-folder-fill"></i>
              ) : (
                <i className="ri-file-fill"></i>
              )}
            </div>
            <div>
              <div className="font-medium text-neutral-800">{modalData.name}</div>
              <div className="text-sm text-neutral-500">
                {modalData.type.charAt(0).toUpperCase() + modalData.type.slice(1)}
              </div>
            </div>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Share Link */}
            {shareUrl ? (
              <div className="mb-6">
                <FormLabel>Share Link</FormLabel>
                <div className="flex mt-1">
                  <Input 
                    value={shareUrl}
                    className="flex-1 rounded-r-none"
                    readOnly
                  />
                  <Button 
                    type="button"
                    variant="primary"
                    className="rounded-l-none"
                    onClick={copyShareLink}
                    title="Copy link"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Permissions */}
                <FormField
                  control={form.control}
                  name="permission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permissions</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select permission" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="view">View only</SelectItem>
                          <SelectItem value="edit">Edit</SelectItem>
                          <SelectItem value="full">Full access</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                {/* Advanced Options */}
                <div className="space-y-4">
                  <FormLabel>Link Protection</FormLabel>
                  <div className="flex flex-col sm:flex-row sm:space-x-4">
                    <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                      <Checkbox 
                        id="usePassword"
                        checked={usePassword}
                        onCheckedChange={(checked) => setUsePassword(checked as boolean)}
                      />
                      <label 
                        htmlFor="usePassword"
                        className="text-sm text-neutral-700 cursor-pointer"
                      >
                        Password protect
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="useExpiration"
                        checked={useExpiration}
                        onCheckedChange={(checked) => setUseExpiration(checked as boolean)}
                      />
                      <label 
                        htmlFor="useExpiration"
                        className="text-sm text-neutral-700 cursor-pointer"
                      >
                        Set expiration
                      </label>
                    </div>
                  </div>
                  
                  {/* Password Input */}
                  {usePassword && (
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Enter password" 
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Expiration Date Input */}
                  {useExpiration && (
                    <FormField
                      control={form.control}
                      name="expiresAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expires on</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              {...field} 
                              onChange={(e) => {
                                const date = new Date(e.target.value);
                                field.onChange(date);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {/* Share on other platforms */}
                <div>
                  <FormLabel>Share on platforms</FormLabel>
                  <div className="flex space-x-3 mt-2">
                    <button 
                      type="button"
                      className="p-2 bg-[#3b5998] text-white rounded-lg hover:opacity-90 transition" 
                      title="Facebook"
                    >
                      <Facebook size={16} />
                    </button>
                    <button 
                      type="button"
                      className="p-2 bg-[#1da1f2] text-white rounded-lg hover:opacity-90 transition" 
                      title="Twitter"
                    >
                      <Twitter size={16} />
                    </button>
                    <button 
                      type="button"
                      className="p-2 bg-[#0077b5] text-white rounded-lg hover:opacity-90 transition" 
                      title="LinkedIn"
                    >
                      <Linkedin size={16} />
                    </button>
                    <button 
                      type="button"
                      className="p-2 bg-neutral-700 text-white rounded-lg hover:opacity-90 transition" 
                      title="Email"
                    >
                      <Mail size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
            
            <DialogFooter className="mt-6">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => setActiveModal(null)}
              >
                Close
              </Button>
              {!shareUrl && (
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={createShareMutation.isPending}
                >
                  {createShareMutation.isPending ? "Creating share link..." : "Share"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
