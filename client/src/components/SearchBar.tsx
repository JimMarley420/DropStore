import React, { useState } from "react";
import { useLocation } from "wouter";
import { useFileContext } from "@/context/FileContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter } from "lucide-react";

export default function SearchBar() {
  const [, setLocation] = useLocation();
  const { searchQuery, setSearchQuery } = useFileContext();
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [dateAdded, setDateAdded] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      // Construct search params
      const params = new URLSearchParams();
      params.append("q", searchQuery);
      if (fileType) params.append("type", fileType);
      if (fileSize) params.append("size", fileSize);
      if (dateAdded) params.append("date", dateAdded);
      
      // Navigate to search results
      setLocation(`/search?${params.toString()}`);
    }
  };

  const handleAdvancedSearch = () => {
    setShowAdvancedSearch(!showAdvancedSearch);
  };

  return (
    <div className="hidden md:flex flex-1 mx-6 lg:mx-12 max-w-2xl relative">
      <form onSubmit={handleSearch} className="w-full flex items-center">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files or folders..."
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus-visible:ring-primary-500"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
          <Search size={18} />
        </div>
      </form>
      
      {/* Advanced Search */}
      <DropdownMenu open={showAdvancedSearch} onOpenChange={setShowAdvancedSearch}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 text-neutral-500 hover:text-primary-500 focus:outline-none p-2 rounded-lg hover:bg-neutral-100"
            title="Advanced search"
            onClick={handleAdvancedSearch}
          >
            <Filter size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-4" align="end">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">File type</label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="images">Images</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="videos">Videos</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="archives">Archives</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Size</label>
                <Select value={fileSize} onValueChange={setFileSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sizes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sizes</SelectItem>
                    <SelectItem value="small">Small (&lt; 1MB)</SelectItem>
                    <SelectItem value="medium">Medium (1-100MB)</SelectItem>
                    <SelectItem value="large">Large (100MB-1GB)</SelectItem>
                    <SelectItem value="xlarge">Very large (&gt; 1GB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Date added</label>
                <Select value={dateAdded} onValueChange={setDateAdded}>
                  <SelectTrigger>
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end mt-2">
                <Button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
                  Apply filters
                </Button>
              </div>
            </div>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
