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
  UserTheme,
  InsertUserTheme,
  fileStatusEnum,
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { log } from "./vite";
import { db } from "./db";
import { eq, and, or, like, desc, isNull, sql } from "drizzle-orm";
import { users, folders, files, shares, userThemes } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { neon } from "@neondatabase/serverless";

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

  // Session store
  readonly sessionStore: session.Store;
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
  private _sessionStore: session.Store;

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
    
    // Initialize session store
    const MemoryStore = require("memorystore")(session);
    this._sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
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

export class DatabaseStorage implements IStorage {
  private uploadDir: string;
  private _sessionStore: session.Store;

  constructor() {
    // Create upload directory if it doesn't exist
    this.uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    
    // Initialize session store
    const PostgresSessionStore = connectPg(session);
    this._sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true
    });
    
    log('Database storage initialized', 'storage');
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      storageUsed: 0,
      storageLimit: 100 * 1024 * 1024 * 1024, // 100GB default
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Create default user theme
    await db.insert(userThemes).values({
      userId: user.id,
      primaryColor: "#4f46e5",
      appearance: "system",
      variant: "professional",
      radius: 8,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return user;
  }

  async updateUserStorage(userId: number, sizeChange: number): Promise<User> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    let newSize = user.storageUsed + sizeChange;
    if (newSize < 0) newSize = 0;
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        storageUsed: newSize,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  // Folder operations
  async getFolderById(id: number): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder;
  }

  async getFoldersByParentId(userId: number, parentId: number | null): Promise<Folder[]> {
    return db.select()
      .from(folders)
      .where(
        and(
          eq(folders.userId, userId),
          eq(folders.status, "active"),
          parentId === null 
            ? isNull(folders.parentId) 
            : eq(folders.parentId, parentId)
        )
      );
  }

  async createFolder(folder: InsertFolder): Promise<Folder> {
    const [newFolder] = await db.insert(folders).values({
      ...folder,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return newFolder;
  }

  async updateFolder(id: number, data: Partial<Folder>): Promise<Folder> {
    const [updatedFolder] = await db
      .update(folders)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(folders.id, id))
      .returning();
      
    if (!updatedFolder) {
      throw new Error(`Folder with ID ${id} not found`);
    }
    
    return updatedFolder;
  }

  async deleteFolder(id: number): Promise<void> {
    // Delete all files in the folder
    await db
      .delete(files)
      .where(eq(files.folderId, id));
    
    // Get all subfolders
    const subfolders = await db
      .select()
      .from(folders)
      .where(eq(folders.parentId, id));
      
    // Delete subfolders recursively
    for (const subfolder of subfolders) {
      await this.deleteFolder(subfolder.id);
    }
    
    // Delete the folder itself
    await db
      .delete(folders)
      .where(eq(folders.id, id));
  }

  async getFolderPath(folderId: number | null): Promise<Array<{ id: number; name: string }>> {
    if (!folderId) return [];
    
    const path: Array<{ id: number; name: string }> = [];
    let currentFolderId = folderId;
    
    while (currentFolderId) {
      const [folder] = await db
        .select({ id: folders.id, name: folders.name, parentId: folders.parentId })
        .from(folders)
        .where(eq(folders.id, currentFolderId));
        
      if (!folder) break;
      
      // Add to the beginning of the array to maintain correct order
      path.unshift({ id: folder.id, name: folder.name });
      
      currentFolderId = folder.parentId;
    }
    
    return path;
  }

  // File operations
  async getFileById(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getFilesByFolderId(userId: number, folderId: number | null): Promise<File[]> {
    return db.select()
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.status, "active"),
          folderId === null 
            ? isNull(files.folderId) 
            : eq(files.folderId, folderId)
        )
      );
  }

  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values({
      ...file,
      status: "active",
      favorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }).returning();
    
    // Update user storage
    await this.updateUserStorage(file.userId, file.size);
    
    return newFile;
  }

  async updateFile(id: number, data: Partial<File>): Promise<File> {
    const [updatedFile] = await db
      .update(files)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(files.id, id))
      .returning();
      
    if (!updatedFile) {
      throw new Error(`File with ID ${id} not found`);
    }
    
    return updatedFile;
  }

  async deleteFile(id: number): Promise<void> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
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
    
    // Delete from database
    await db
      .delete(files)
      .where(eq(files.id, id));
  }

  async moveFileToTrash(id: number): Promise<File> {
    const [updatedFile] = await db
      .update(files)
      .set({ 
        status: "trashed",
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(files.id, id))
      .returning();
      
    if (!updatedFile) {
      throw new Error(`File with ID ${id} not found`);
    }
    
    return updatedFile;
  }

  async restoreFileFromTrash(id: number): Promise<File> {
    const [updatedFile] = await db
      .update(files)
      .set({ 
        status: "active",
        deletedAt: null,
        updatedAt: new Date()
      })
      .where(eq(files.id, id))
      .returning();
      
    if (!updatedFile) {
      throw new Error(`File with ID ${id} not found`);
    }
    
    return updatedFile;
  }

  // Search operations
  async searchFiles(userId: number, query: string, type?: string): Promise<File[]> {
    // Base query for active files by this user
    let baseQuery = db
      .select()
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.status, "active")
        )
      );
    
    // Add text search if query is provided
    if (query) {
      const lowerQuery = `%${query.toLowerCase()}%`;
      baseQuery = baseQuery.where(
        or(
          like(sql`lower(${files.name})`, lowerQuery),
          like(sql`lower(${files.originalName})`, lowerQuery)
        )
      );
    }
    
    // Filter by type if provided
    if (type) {
      switch (type) {
        case "images":
          baseQuery = baseQuery.where(like(files.type, 'image/%'));
          break;
        case "documents":
          baseQuery = baseQuery.where(
            or(
              like(files.type, '%pdf%'),
              like(files.type, '%word%'),
              like(files.type, '%excel%'),
              like(files.type, '%powerpoint%'),
              like(files.type, '%text%'),
              like(files.type, '%spreadsheet%'),
              like(files.type, '%presentation%')
            )
          );
          break;
        case "videos":
          baseQuery = baseQuery.where(like(files.type, 'video/%'));
          break;
        case "audio":
          baseQuery = baseQuery.where(like(files.type, 'audio/%'));
          break;
      }
    }
    
    return baseQuery;
  }

  // Share operations
  async createShare(share: InsertShare): Promise<Share> {
    const [newShare] = await db.insert(shares).values({
      ...share,
      createdAt: new Date()
    }).returning();
    
    return newShare;
  }

  async getShareByToken(token: string): Promise<Share | undefined> {
    const [share] = await db.select().from(shares).where(eq(shares.token, token));
    return share;
  }

  async deleteShare(id: number): Promise<void> {
    await db.delete(shares).where(eq(shares.id, id));
  }

  // Stats
  async getUserStorageStats(userId: number): Promise<{ used: number; total: number }> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
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
  
  // Getter for session store
  get sessionStore(): session.Store {
    return this._sessionStore;
  }
  
  // Setter for session store
  set sessionStore(store: session.Store) {
    this._sessionStore = store;
  }
}

// Utiliser le stockage en base de données
export const storage = new DatabaseStorage();
