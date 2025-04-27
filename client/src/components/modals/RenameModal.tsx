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
import { renameItemSchema } from "@shared/schema";

export default function RenameModal() {
  const { activeModal, setActiveModal, modalData } = useFileContext();
  const { toast } = useToast();

  // Create a form with validation
  const form = useForm<z.infer<typeof renameItemSchema>>({
    resolver: zodResolver(renameItemSchema),
    defaultValues: {
      id: modalData?.id || 0,
      type: modalData?.type || "file",
      name: modalData?.name || "",
    },
  });

  // Update form values when modalData changes
  React.useEffect(() => {
    if (modalData) {
      form.reset({
        id: modalData.id || 0,
        type: modalData.type || "file",
        name: modalData.name || "",
      });
    }
  }, [modalData, form]);

  // Rename item mutation
  const renameMutation = useMutation({
    mutationFn: (values: z.infer<typeof renameItemSchema>) => {
      const endpoint = values.type === "folder" 
        ? `/api/folders/${values.id}/rename` 
        : `/api/files/${values.id}/rename`;
      
      return apiRequest("PATCH", endpoint, { name: values.name });
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      if (modalData?.folderId) {
        queryClient.invalidateQueries({ queryKey: [`/api/folders/${modalData.folderId}/contents`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/folders/contents"] });
      }
      
      toast({
        title: "Item renamed",
        description: `${modalData?.type === "folder" ? "Folder" : "File"} has been renamed to "${form.getValues().name}".`,
      });
      
      // Close the modal
      setActiveModal(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to rename item",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: z.infer<typeof renameItemSchema>) => {
    renameMutation.mutate(values);
  };

  return (
    <Dialog 
      open={activeModal === "rename"} 
      onOpenChange={(open) => !open && setActiveModal(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {modalData?.type === "folder" ? "Rename Folder" : "Rename File"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter new name" 
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
                disabled={renameMutation.isPending}
              >
                {renameMutation.isPending ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
