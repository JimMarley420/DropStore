import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  createFolderSchema, 
  uploadFileSchema, 
  shareFileSchema, 
  renameItemSchema, 
  moveItemSchema, 
  deleteItemSchema, 
  searchSchema,
  registerSchema,
  loginSchema,
  insertUserSchema,
  updateProfileSchema
} from "@shared/schema";
import adminRouter from "./adminRoutes";
import { isAuthenticated, isAdmin } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@shared/validation";
import { log } from "./vite";
import { setupAuth, hashPassword } from "./auth";
import passport from "passport";

// Configure multer for file storage
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage2 = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    // Generate unique filename
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter to validate mime types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

const upload = multer({
  storage: storage2,
  limits: {
    fileSize: MAX_FILE_SIZE // 10GB max file size
  },
  fileFilter
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup authentication
  setupAuth(app);
  
  // Register admin routes
  app.use("/api/admin", adminRouter);

  // Remarque: Nous utilisons isAuthenticated depuis auth.ts, donc cette redéfinition locale est supprimée
  // Utilisons le middleware d'authentification importé de auth.ts à la place

  // Middleware to set user ID from session
  app.use((req, _res, next) => {
    if (req.isAuthenticated() && req.user) {
      (req as any).userId = req.user.id;
    }
    next();
  });
  
  // ===== Auth API Routes =====
  
  // Register a new user
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      // Utiliser insertUserSchema plutôt que registerSchema pour la validation côté serveur
      // car registerSchema contient confirmPassword qui n'est pas dans le modèle
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          log(`Login error after registration: ${err}`, 'auth');
          return res.status(500).json({ message: "Failed to login after registration" });
        }
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      log(`Registration error: ${error}`, 'auth');
      return res.status(400).json({ message: error.message || "Failed to register" });
    }
  });
  
  // Login
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      log(`Login attempt for user: ${validatedData.username}`, 'auth-debug');
      
      // Use passport middleware for authentication
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          log(`Authentication error: ${err}`, 'auth-debug');
          return res.status(500).json({ message: "Authentication failed" });
        }
        
        if (!user) {
          log(`Login failed for user: ${validatedData.username}, reason: ${info?.message || "Invalid credentials"}`, 'auth-debug');
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        // Log successful authentication
        log(`User authenticated successfully: ${user.username}, role: ${user.role}`, 'auth-debug');
        
        // Establish session
        req.login(user, (err) => {
          if (err) {
            log(`Login error: ${err}`, 'auth-debug');
            return res.status(500).json({ message: "Failed to login" });
          }
          
          // Log session information
          log(`Session established: ${req.sessionID}, user: ${user.username}, role: ${user.role}`, 'auth-debug');
          
          // Don't return the password
          const { password, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error: any) {
      log(`Login validation error: ${error}`, 'auth-debug');
      return res.status(400).json({ message: error.message || "Invalid login data" });
    }
  });
  
  // Logout
  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        log(`Logout error: ${err}`, 'auth');
        return res.status(500).json({ message: "Failed to logout" });
      }
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // ===== User API Routes =====
  
  // Get user profile
  app.get("/api/user", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back
      const { password, ...userProfile } = user;
      return res.json(userProfile);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  
  // Get user storage stats
  app.get("/api/user/storage", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    
    try {
      const stats = await storage.getUserStorageStats(userId);
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching storage stats:", error);
      return res.status(500).json({ message: "Failed to fetch storage stats" });
    }
  });
  
  // Update user profile
  app.patch("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user profile
      const updatedUser = await storage.updateUser(userId, validatedData);
      
      // Don't send password back
      const { password, ...userProfile } = updatedUser;
      return res.json(userProfile);
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      return res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  // ===== Folder API Routes =====
  
  // Get folder contents (folders and files)
  app.get("/api/folders/:folderId?/contents", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const folderId = req.params.folderId ? parseInt(req.params.folderId) : null;
    
    try {
      // Verify folder exists if ID is provided
      if (folderId !== null) {
        const folder = await storage.getFolderById(folderId);
        if (!folder) {
          return res.status(404).json({ message: "Folder not found" });
        }
        
        // Verify folder belongs to user
        if (folder.userId !== userId) {
          return res.status(403).json({ message: "You don't have access to this folder" });
        }
      }
      
      const contents = await storage.getFolderContents(userId, folderId);
      return res.json(contents);
    } catch (error) {
      console.error("Error fetching folder contents:", error);
      return res.status(500).json({ message: "Failed to fetch folder contents" });
    }
  });
  
  // Create a new folder
  app.post("/api/folders", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    
    try {
      const validatedData = createFolderSchema.parse(req.body);
      
      // Verify parent folder exists if parentId is provided
      if (validatedData.parentId) {
        const parentFolder = await storage.getFolderById(validatedData.parentId);
        if (!parentFolder) {
          return res.status(404).json({ message: "Parent folder not found" });
        }
        
        // Verify parent folder belongs to user
        if (parentFolder.userId !== userId) {
          return res.status(403).json({ message: "You don't have access to this parent folder" });
        }
      }
      
      // Generate folder path
      let folderPath = '';
      if (validatedData.parentId) {
        const parentPath = await storage.getFolderPath(validatedData.parentId);
        folderPath = '/' + parentPath.map(p => p.name).join('/') + '/' + validatedData.name;
      } else {
        folderPath = '/' + validatedData.name;
      }
      
      const folder = await storage.createFolder({
        name: validatedData.name,
        userId,
        parentId: validatedData.parentId || null,
        path: folderPath
      });
      
      return res.status(201).json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      return res.status(400).json({ message: `Failed to create folder: ${error.message}` });
    }
  });
  
  // Rename a folder
  app.patch("/api/folders/:id/rename", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const folderId = parseInt(req.params.id);
    
    try {
      const validatedData = renameItemSchema.parse({
        id: folderId,
        type: "folder",
        ...req.body
      });
      
      // Verify folder exists
      const folder = await storage.getFolderById(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      // Verify folder belongs to user
      if (folder.userId !== userId) {
        return res.status(403).json({ message: "You don't have access to this folder" });
      }
      
      // Update folder
      const updatedFolder = await storage.updateFolder(folderId, {
        name: validatedData.name
      });
      
      return res.json(updatedFolder);
    } catch (error) {
      console.error("Error renaming folder:", error);
      return res.status(400).json({ message: `Failed to rename folder: ${error.message}` });
    }
  });
  
  // Delete a folder
  app.delete("/api/folders/:id", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const folderId = parseInt(req.params.id);
    
    try {
      // Verify folder exists
      const folder = await storage.getFolderById(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      // Verify folder belongs to user
      if (folder.userId !== userId) {
        return res.status(403).json({ message: "You don't have access to this folder" });
      }
      
      // Delete folder
      await storage.deleteFolder(folderId);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting folder:", error);
      return res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // ===== File API Routes =====
  
  // Upload a file
  app.post("/api/files/upload", isAuthenticated, upload.single("file"), async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Préparer les données pour la validation
      const dataToValidate = {
        ...req.body,
        // Convertir folderId en nombre si présent
        folderId: req.body.folderId ? parseInt(req.body.folderId, 10) : null
      };
      
      const validatedData = uploadFileSchema.parse(dataToValidate);
      
      // Verify folder exists if folderId is provided
      if (validatedData.folderId) {
        const folder = await storage.getFolderById(validatedData.folderId);
        if (!folder) {
          return res.status(404).json({ message: "Folder not found" });
        }
        
        // Verify folder belongs to user
        if (folder.userId !== userId) {
          return res.status(403).json({ message: "You don't have access to this folder" });
        }
      }
      
      // Save file metadata
      const filePath = path.relative(uploadDir, req.file.path);
      const file = await storage.createFile({
        name: req.file.originalname,
        originalName: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        userId,
        folderId: validatedData.folderId || null,
        path: filePath
      });
      
      return res.status(201).json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      
      // Delete the file if it was uploaded
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error("Error deleting file after failed upload:", e);
        }
      }
      
      return res.status(400).json({ message: `Failed to upload file: ${error.message}` });
    }
  });
  
  // Get file metadata
  app.get("/api/files/:id", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const fileId = parseInt(req.params.id);
    const shareToken = req.query.token as string | undefined;
    
    try {
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // If a share token is provided, verify it
      if (shareToken) {
        const share = await storage.getShareByToken(shareToken);
        
        // Check if share is valid
        if (!share) {
          return res.status(404).json({ message: "Share not found or has expired" });
        }
        
        // Check if share has expired
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
          return res.status(410).json({ message: "Share link has expired" });
        }
        
        // Check if password is required and provided
        if (share.password) {
          const providedPassword = req.query.password as string | undefined;
          
          if (!providedPassword) {
            return res.status(401).json({ message: "Password required", passwordRequired: true });
          }
          
          if (providedPassword !== share.password) {
            return res.status(401).json({ message: "Invalid password" });
          }
        }
        
        // Check if the file is in the shared folder or is directly shared
        const isSharedFile = share.fileId === fileId;
        const isInSharedFolder = share.folderId && file.folderId === share.folderId;
        
        if (!isSharedFile && !isInSharedFolder) {
          return res.status(403).json({ message: "File is not part of this share" });
        }
      } else {
        // No share token, verify file belongs to the authenticated user
        if (!userId) {
          return res.status(401).json({ message: "Authentication required" });
        }
        
        if (file.userId !== userId) {
          return res.status(403).json({ message: "You don't have access to this file" });
        }
      }
      
      return res.json(file);
    } catch (error: any) {
      console.error("Error fetching file:", error);
      return res.status(500).json({ message: "Failed to fetch file" });
    }
  });
  
  // Get file content
  app.get("/api/files/:id/content", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const fileId = parseInt(req.params.id);
    const shareToken = req.query.token as string | undefined;
    
    try {
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // If a share token is provided, verify it
      if (shareToken) {
        const share = await storage.getShareByToken(shareToken);
        
        // Check if share is valid
        if (!share) {
          return res.status(404).json({ message: "Share not found or has expired" });
        }
        
        // Check if share has expired
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
          return res.status(410).json({ message: "Share link has expired" });
        }
        
        // Check if password is required and provided
        if (share.password) {
          const providedPassword = req.query.password as string | undefined;
          
          if (!providedPassword) {
            return res.status(401).json({ message: "Password required", passwordRequired: true });
          }
          
          if (providedPassword !== share.password) {
            return res.status(401).json({ message: "Invalid password" });
          }
        }
        
        // Check if the file is in the shared folder or is directly shared
        const isSharedFile = share.fileId === fileId;
        const isInSharedFolder = share.folderId && file.folderId === share.folderId;
        
        if (!isSharedFile && !isInSharedFolder) {
          return res.status(403).json({ message: "File is not part of this share" });
        }
        
        // For shared files, add appropriate security headers
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        // No share token, verify file belongs to the authenticated user
        if (!userId) {
          return res.status(401).json({ message: "Authentication required" });
        }
        
        if (file.userId !== userId) {
          return res.status(403).json({ message: "You don't have access to this file" });
        }
      }
      
      // Construct full file path
      const filePath = path.join(uploadDir, file.path);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File content not found" });
      }
      
      // Set content disposition
      // Use attachment for download, inline for preview
      const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
      res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(file.originalName)}"`);
      res.setHeader('Content-Type', file.type);
      
      // Stream file to response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      console.error("Error streaming file:", error);
      return res.status(500).json({ message: "Failed to stream file" });
    }
  });
  
  // Rename a file
  app.patch("/api/files/:id/rename", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const fileId = parseInt(req.params.id);
    
    try {
      const validatedData = renameItemSchema.parse({
        id: fileId,
        type: "file",
        ...req.body
      });
      
      // Verify file exists
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Verify file belongs to user
      if (file.userId !== userId) {
        return res.status(403).json({ message: "You don't have access to this file" });
      }
      
      // Update file
      const updatedFile = await storage.updateFile(fileId, {
        name: validatedData.name
      });
      
      return res.json(updatedFile);
    } catch (error) {
      console.error("Error renaming file:", error);
      return res.status(400).json({ message: `Failed to rename file: ${error.message}` });
    }
  });
  
  // Delete a file
  app.delete("/api/files/:id", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const fileId = parseInt(req.params.id);
    
    try {
      // Verify file exists
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Verify file belongs to user
      if (file.userId !== userId) {
        return res.status(403).json({ message: "You don't have access to this file" });
      }
      
      // Move file to trash
      await storage.moveFileToTrash(fileId);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      return res.status(500).json({ message: "Failed to delete file" });
    }
  });
  
  // Permanently delete a file
  app.delete("/api/files/:id/permanent", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const fileId = parseInt(req.params.id);
    
    try {
      // Verify file exists
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Verify file belongs to user
      if (file.userId !== userId) {
        return res.status(403).json({ message: "You don't have access to this file" });
      }
      
      // Delete file permanently
      await storage.deleteFile(fileId);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error permanently deleting file:", error);
      return res.status(500).json({ message: "Failed to permanently delete file" });
    }
  });
  
  // Restore a file from trash
  app.post("/api/files/:id/restore", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const fileId = parseInt(req.params.id);
    
    try {
      // Verify file exists
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Verify file belongs to user
      if (file.userId !== userId) {
        return res.status(403).json({ message: "You don't have access to this file" });
      }
      
      // Restore file from trash
      const restoredFile = await storage.restoreFileFromTrash(fileId);
      
      return res.json(restoredFile);
    } catch (error) {
      console.error("Error restoring file:", error);
      return res.status(500).json({ message: "Failed to restore file" });
    }
  });
  
  // Toggle favorite status
  app.patch("/api/files/:id/favorite", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const fileId = parseInt(req.params.id);
    
    try {
      // Verify file exists
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Verify file belongs to user
      if (file.userId !== userId) {
        return res.status(403).json({ message: "You don't have access to this file" });
      }
      
      // Toggle favorite status
      const updatedFile = await storage.updateFile(fileId, {
        favorite: !file.favorite
      });
      
      return res.json(updatedFile);
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      return res.status(500).json({ message: "Failed to update favorite status" });
    }
  });

  // ===== Share API Routes =====
  
  // Create a share link
  app.post("/api/shares", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    
    try {
      const validatedData = shareFileSchema.parse(req.body);
      
      // Check if item exists
      if (validatedData.type === "file") {
        const file = await storage.getFileById(validatedData.id);
        if (!file) {
          return res.status(404).json({ message: "File not found" });
        }
        
        // Verify file belongs to user
        if (file.userId !== userId) {
          return res.status(403).json({ message: "You don't have access to this file" });
        }
      } else {
        const folder = await storage.getFolderById(validatedData.id);
        if (!folder) {
          return res.status(404).json({ message: "Folder not found" });
        }
        
        // Verify folder belongs to user
        if (folder.userId !== userId) {
          return res.status(403).json({ message: "You don't have access to this folder" });
        }
      }
      
      // Generate share token
      const token = uuidv4();
      
      // Create share
      const share = await storage.createShare({
        userId,
        fileId: validatedData.type === "file" ? validatedData.id : null,
        folderId: validatedData.type === "folder" ? validatedData.id : null,
        token,
        permission: validatedData.permission,
        password: validatedData.password,
        expiresAt: validatedData.expiresAt
      });
      
      return res.status(201).json({
        ...share,
        shareUrl: `${req.protocol}://${req.get('host')}/share/${token}`
      });
    } catch (error) {
      console.error("Error creating share:", error);
      return res.status(400).json({ message: `Failed to create share: ${error.message}` });
    }
  });
  
  // Get shared item by token
  app.get("/api/shares/:token", async (req: Request, res: Response) => {
    const token = req.params.token;
    
    try {
      const share = await storage.getShareByToken(token);
      if (!share) {
        return res.status(404).json({ message: "Share not found or has expired" });
      }
      
      // Check if share has expired
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        return res.status(410).json({ message: "Share link has expired" });
      }
      
      // Check if password is required
      if (share.password && !req.query.password) {
        return res.status(401).json({ message: "Password required", passwordRequired: true });
      }
      
      // Verify password if provided
      if (share.password && req.query.password !== share.password) {
        return res.status(401).json({ message: "Invalid password" });
      }
      
      // Get the shared item
      let sharedItem = null;
      if (share.fileId) {
        sharedItem = await storage.getFileById(share.fileId);
        if (!sharedItem) {
          return res.status(404).json({ message: "Shared file not found" });
        }
      } else if (share.folderId) {
        const contents = await storage.getFolderContents(share.userId, share.folderId);
        sharedItem = {
          type: "folder",
          ...contents
        };
      }
      
      return res.json({
        share,
        item: sharedItem
      });
    } catch (error) {
      console.error("Error fetching shared item:", error);
      return res.status(500).json({ message: "Failed to fetch shared item" });
    }
  });

  // ===== Search API Routes =====
  
  // Search files
  app.get("/api/search", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    
    try {
      const validatedData = searchSchema.parse(req.query);
      
      // Search files
      const results = await storage.searchFiles(userId, validatedData.query, validatedData.type);
      
      return res.json(results);
    } catch (error) {
      console.error("Error searching files:", error);
      return res.status(400).json({ message: `Failed to search files: ${error.message}` });
    }
  });

  // ===== Trash API Routes =====
  
  // Get trash contents
  app.get("/api/trash", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    
    try {
      // Get trashed files
      const trashedFiles = Array.from((await storage as any).files.values())
        .filter((file) => file.userId === userId && file.status === "trashed")
        .map((file) => ({ ...file, type: "file" }));
      
      return res.json(trashedFiles);
    } catch (error) {
      console.error("Error fetching trash contents:", error);
      return res.status(500).json({ message: "Failed to fetch trash contents" });
    }
  });
  
  // Empty trash
  app.delete("/api/trash", async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    
    try {
      // Get all trashed files
      const trashedFiles = Array.from((await storage as any).files.values())
        .filter((file) => file.userId === userId && file.status === "trashed");
      
      // Delete each file permanently
      for (const file of trashedFiles) {
        await storage.deleteFile(file.id);
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error emptying trash:", error);
      return res.status(500).json({ message: "Failed to empty trash" });
    }
  });

  return httpServer;
}
