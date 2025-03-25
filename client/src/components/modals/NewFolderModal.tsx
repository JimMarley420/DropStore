import React from "react";
import { useFileContext } from "@/context/FileContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createFolderSchema } from "@shared/schema";

export default function NewFolderModal() {
  const { activeModal, setActiveModal, modalData } = useFileContext();
  const { toast } = useToast();

  // Create a form with validation
  const form = useForm<z.infer<typeof createFolderSchema>>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: "",
      parentId: modalData?.folderId || null,
    },
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: (values: z.infer<typeof createFolderSchema>) => {
      return apiRequest("POST", "/api/folders", values);
    },
    onSuccess: async () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      if (modalData?.folderId) {
        queryClient.invalidateQueries({ queryKey: [`/api/folders/${modalData.folderId}/contents`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/folders/contents"] });
      }
      
      toast({
        title: "Folder created",
        description: `Folder "${form.getValues().name}" has been created.`,
      });
      
      // Close the modal
      setActiveModal(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to create folder",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: z.infer<typeof createFolderSchema>) => {
    createFolderMutation.mutate(values);
  };

  return (
    <Dialog 
      open={activeModal === "newFolder"} 
      onOpenChange={(open) => !open && setActiveModal(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter folder name" 
                      {...field} 
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={createFolderMutation.isPending}
              >
                {createFolderMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
