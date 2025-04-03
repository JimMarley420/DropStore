import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/file-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { UserIcon } from "lucide-react";
import ProfileModal from "@/components/modals/ProfileModal";

export default function StorageStats() {
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Get user storage stats
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["/api/user/storage"],
  });

  // Calculate usage percentage
  const usagePercentage = stats ? (stats.used / stats.total) * 100 : 0;

  if (isLoading) {
    return (
      <div className="px-4 mb-6">
        <div className="mb-2 flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="mt-3 h-8 w-full rounded-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 mb-6 text-sm text-red-500">
        Failed to load storage information
      </div>
    );
  }

  return (
    <>
      <div className="px-4 mb-6">
        <div className="mb-2 flex justify-between items-center">
          <h3 className="font-medium text-gray-200">Storage</h3>
          <span className="text-xs text-gray-400">
            {formatFileSize(stats?.used || 0)} / {formatFileSize(stats?.total || 0)}
          </span>
        </div>
        <Progress
          value={usagePercentage}
          className="h-2 bg-gray-700/50"
          indicatorClassName="gradient-progress"
        />
        <Button
          variant="outline"
          className="mt-3 text-sm text-center w-full py-1.5 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
          onClick={() => setProfileOpen(true)}
        >
          <UserIcon className="mr-2 h-4 w-4" />
          Profile
        </Button>
      </div>
      
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
