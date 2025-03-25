import {
  User,
  InsertUser,
  Folder,
  InsertFolder,
  File,
  InsertFile,
  Share,
  InsertShare,
  FileWithPath,
  FolderWithPath,
  fileStatusEnum,
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { log } from "./vite";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStorage(userId: number, sizeChange: number): Promise<User>;

  // Folder operations
  getFolderById(id: number): Promise<Folder | undefined>;
  getFoldersByParentId(userId: number, parentId: number | null): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, data: Partial<Folder>): Promise<Folder>;
  deleteFolder(id: number): Promise<void>;
  getFolderPath(folderId: number | null): Promise<Array<{ id: number; name: string }>>;
  
  // File operations
  getFileById(id: number): Promise<File | undefined>;
  getFilesByFolderId(userId: number, folderId: number | null): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, data: Partial<File>): Promise<File>;
  deleteFile(id: number): Promise<void>;
  moveFileToTrash(id: number): Promise<File>;
  restoreFileFromTrash(id: number): Promise<File>;
  
  // Search operations
  searchFiles(userId: number, query: string, type?: string): Promise<File[]>;
  
  // Share operations
  createShare(share: InsertShare): Promise<Share>;
  getShareByToken(token: string): Promise<Share | undefined>;
  deleteShare(id: number): Promise<void>;
  
  // Stats
  getUserStorageStats(userId: number): Promise<{ used: number; total: number }>;
  
  // Utility methods
  getFolderContents(userId: number, folderId: number | null): Promise<{ 
    folders: FolderWithPath[]; 
    files: FileWithPath[]; 
    breadcrumbs: Array<{ id: number | null; name: string }>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private folders: Map<number, Folder>;
  private files: Map<number, File>;
  private shares: Map<number, Share>;
  private currentUserId: number;
  private currentFolderId: number;
  private currentFileId: number;
  private currentShareId: number;
  private uploadDir: string;

  constructor() {
    this.users = new Map();
    this.folders = new Map();
    this.files = new Map();
    this.shares = new Map();
    this.currentUserId = 1;
    this.currentFolderId = 1;
    this.currentFileId = 1;
    this.currentShareId = 1;
    
    // Create upload directory if it doesn't exist
    this.uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create a demo user
    const demoUser: User = {
      id: this.currentUserId++,
      username: "demo",
      password: "password",
      storageUsed: 0,
      storageLimit: 100 * 1024 * 1024 * 1024, // 100GB
      createdAt: new Date(),
    };
    
    this.users.set(demoUser.id, demoUser);
    
    // Create some demo folders
    const documentsFolderId = this.currentFolderId;
    const documentsFolder: Folder = {
      id: documentsFolderId,
      name: "Documents",
      userId: demoUser.id,
      parentId: null,
      status: "active",
      path: "/Documents",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.folders.set(documentsFolderId, documentsFolder);
    this.currentFolderId++;
    
    const imagesFolderId = this.currentFolderId;
    const imagesFolder: Folder = {
      id: imagesFolderId,
      name: "Images",
      userId: demoUser.id,
      parentId: null,
      status: "active",
      path: "/Images",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.folders.set(imagesFolderId, imagesFolder);
    this.currentFolderId++;
    
    const videosFolderId = this.currentFolderId;
    const videosFolder: Folder = {
      id: videosFolderId,
      name: "Videos",
      userId: demoUser.id,
      parentId: null,
      status: "active",
      path: "/Videos",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.folders.set(videosFolderId, videosFolder);
    this.currentFolderId++;
    
    const projectsFolderId = this.currentFolderId;
    const projectsFolder: Folder = {
      id: projectsFolderId,
      name: "Projects",
      userId: demoUser.id,
      parentId: null,
      status: "active",
      path: "/Projects",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.folders.set(projectsFolderId, projectsFolder);
    this.currentFolderId++;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      storageUsed: 0,
      storageLimit: 100 * 1024 * 1024 * 1024, // 100GB default
      createdAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStorage(userId: number, sizeChange: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    user.storageUsed += sizeChange;
    if (user.storageUsed < 0) user.storageUsed = 0;
    
    this.users.set(userId, user);
    return user;
  }

  // Folder operations
  async getFolderById(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async getFoldersByParentId(userId: number, parentId: number | null): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (folder) => folder.userId === userId && folder.parentId === parentId && folder.status === "active"
    );
  }

  async createFolder(folder: InsertFolder): Promise<Folder> {
    const id = this.currentFolderId++;
    const now = new Date();
    const newFolder: Folder = {
      ...folder,
      id,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    this.folders.set(id, newFolder);
    return newFolder;
  }

  async updateFolder(id: number, data: Partial<Folder>): Promise<Folder> {
    const folder = await this.getFolderById(id);
    if (!folder) {
      throw new Error(`Folder with ID ${id} not found`);
    }

    const updatedFolder: Folder = {
      ...folder,
      ...data,
      updatedAt: new Date(),
    };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }

  async deleteFolder(id: number): Promise<void> {
    // Permanently delete folder
    this.folders.delete(id);
    
    // Delete all files in the folder
    for (const file of Array.from(this.files.values())) {
      if (file.folderId === id) {
        this.files.delete(file.id);
      }
    }
    
    // Delete all subfolders recursively
    for (const folder of Array.from(this.folders.values())) {
      if (folder.parentId === id) {
        await this.deleteFolder(folder.id);
      }
    }
  }

  async getFolderPath(folderId: number | null): Promise<Array<{ id: number; name: string }>> {
    if (!folderId) return [];
    
    const path: Array<{ id: number; name: string }> = [];
    let currentFolder = await this.getFolderById(folderId);
    
    while (currentFolder) {
      // Add to the beginning of the array to maintain correct order
      path.unshift({ id: currentFolder.id, name: currentFolder.name });
      
      if (currentFolder.parentId) {
        currentFolder = await this.getFolderById(currentFolder.parentId);
      } else {
        break;
      }
    }
    
    return path;
  }

  // File operations
  async getFileById(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByFolderId(userId: number, folderId: number | null): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId && file.folderId === folderId && file.status === "active"
    );
  }

  async createFile(file: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const now = new Date();
    const newFile: File = {
      ...file,
      id,
      status: "active",
      favorite: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.files.set(id, newFile);
    
    // Update user storage
    await this.updateUserStorage(file.userId, file.size);
    
    return newFile;
  }

  async updateFile(id: number, data: Partial<File>): Promise<File> {
    const file = await this.getFileById(id);
    if (!file) {
      throw new Error(`File with ID ${id} not found`);
    }

    const updatedFile: File = {
      ...file,
      ...data,
      updatedAt: new Date(),
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: number): Promise<void> {
    const file = await this.getFileById(id);
    if (!file) {
      throw new Error(`File with ID ${id} not found`);
    }
    
    // Remove the file from storage
    try {
      const filePath = path.join(this.uploadDir, file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      log(`Error deleting file: ${error}`, "storage");
    }
    
    // Update user storage
    await this.updateUserStorage(file.userId, -file.size);
    
    // Remove from map
    this.files.delete(id);
  }

  async moveFileToTrash(id: number): Promise<File> {
    const file = await this.getFileById(id);
    if (!file) {
      throw new Error(`File with ID ${id} not found`);
    }

    const updatedFile: File = {
      ...file,
      status: "trashed",
      deletedAt: new Date(),
      updatedAt: new Date(),
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async restoreFileFromTrash(id: number): Promise<File> {
    const file = await this.getFileById(id);
    if (!file) {
      throw new Error(`File with ID ${id} not found`);
    }

    const updatedFile: File = {
      ...file,
      status: "active",
      deletedAt: null,
      updatedAt: new Date(),
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  // Search operations
  async searchFiles(userId: number, query: string, type?: string): Promise<File[]> {
    let results = Array.from(this.files.values()).filter(
      (file) => file.userId === userId && file.status === "active"
    );
    
    // Filter by query
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter((file) => 
        file.name.toLowerCase().includes(lowerQuery) || 
        file.originalName.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Filter by type if provided
    if (type) {
      switch (type) {
        case "images":
          results = results.filter((file) => file.type.startsWith("image/"));
          break;
        case "documents":
          results = results.filter((file) => 
            file.type.includes("pdf") ||
            file.type.includes("word") ||
            file.type.includes("excel") ||
            file.type.includes("powerpoint") ||
            file.type.includes("text") ||
            file.type.includes("spreadsheet") ||
            file.type.includes("presentation")
          );
          break;
        case "videos":
          results = results.filter((file) => file.type.startsWith("video/"));
          break;
        case "audio":
          results = results.filter((file) => file.type.startsWith("audio/"));
          break;
      }
    }
    
    return results;
  }

  // Share operations
  async createShare(share: InsertShare): Promise<Share> {
    const id = this.currentShareId++;
    const now = new Date();
    const newShare: Share = {
      ...share,
      id,
      createdAt: now,
    };
    this.shares.set(id, newShare);
    return newShare;
  }

  async getShareByToken(token: string): Promise<Share | undefined> {
    return Array.from(this.shares.values()).find(
      (share) => share.token === token
    );
  }

  async deleteShare(id: number): Promise<void> {
    this.shares.delete(id);
  }

  // Stats
  async getUserStorageStats(userId: number): Promise<{ used: number; total: number }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return {
      used: user.storageUsed,
      total: user.storageLimit,
    };
  }

  // Utility methods
  async getFolderContents(userId: number, folderId: number | null): Promise<{ 
    folders: FolderWithPath[]; 
    files: FileWithPath[];
    breadcrumbs: Array<{ id: number | null; name: string }>;
  }> {
    // Get folders
    const rawFolders = await this.getFoldersByParentId(userId, folderId);
    const folders: FolderWithPath[] = await Promise.all(
      rawFolders.map(async (folder) => {
        // Get item count for each folder
        const folderItems = await this.getFoldersByParentId(userId, folder.id);
        const fileItems = await this.getFilesByFolderId(userId, folder.id);
        const itemCount = folderItems.length + fileItems.length;
        
        // Get breadcrumbs
        const breadcrumbs = await this.getFolderPath(folder.id);
        
        return {
          ...folder,
          itemCount,
          breadcrumbs,
        };
      })
    );
    
    // Get files
    const rawFiles = await this.getFilesByFolderId(userId, folderId);
    const files: FileWithPath[] = await Promise.all(
      rawFiles.map(async (file) => {
        // Get breadcrumbs
        const breadcrumbs = await this.getFolderPath(file.folderId);
        
        return {
          ...file,
          breadcrumbs,
          url: `/api/files/${file.id}/content`, // URL for downloading/viewing file
        };
      })
    );
    
    // Get breadcrumbs for current folder
    let breadcrumbs: Array<{ id: number | null; name: string }> = [
      { id: null, name: "Home" }
    ];
    
    if (folderId) {
      const folderPath = await this.getFolderPath(folderId);
      breadcrumbs = [
        { id: null, name: "Home" },
        ...folderPath
      ];
    }
    
    return {
      folders,
      files,
      breadcrumbs,
    };
  }
}

export const storage = new MemStorage();
