import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { fileTypeSchema } from "./validation";

// Enum for file permissions
export const filePermissionEnum = pgEnum('file_permission', ['view', 'edit', 'full']);

// Enum for file status
export const fileStatusEnum = pgEnum('file_status', ['active', 'trashed', 'deleted']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  storageUsed: integer("storage_used").notNull().default(0),
  storageLimit: integer("storage_limit").notNull().default(100 * 1024 * 1024 * 1024), // 100GB default
  createdAt: timestamp("created_at").defaultNow()
});

// Folders table
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  parentId: integer("parent_id").references(() => folders.id),
  status: fileStatusEnum("status").default("active").notNull(),
  path: text("path").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  folderId: integer("folder_id").references(() => folders.id),
  path: text("path").notNull(),
  status: fileStatusEnum("status").default("active").notNull(), // active, trashed, deleted
  favorite: boolean("favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
});

// Shares table
export const shares = pgTable("shares", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fileId: integer("file_id").references(() => files.id),
  folderId: integer("folder_id").references(() => folders.id),
  token: text("token").notNull().unique(),
  permission: filePermissionEnum("permission").default("view").notNull(),
  password: text("password"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Validation schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  userId: true,
  parentId: true,
  path: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  name: true,
  originalName: true,
  type: true,
  size: true,
  userId: true,
  folderId: true,
  path: true,
});

export const insertShareSchema = createInsertSchema(shares).pick({
  userId: true,
  fileId: true,
  folderId: true,
  token: true,
  permission: true,
  password: true,
  expiresAt: true,
});

// Validation schemas for forms
export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255),
  parentId: z.number().optional().nullable(),
});

export const uploadFileSchema = z.object({
  folderId: z.number().optional().nullable(),
});

export const shareFileSchema = z.object({
  id: z.number(),
  type: z.enum(["file", "folder"]),
  permission: z.enum(["view", "edit", "full"]),
  password: z.string().optional(),
  expiresAt: z.date().optional(),
});

export const renameItemSchema = z.object({
  id: z.number(),
  type: z.enum(["file", "folder"]),
  name: z.string().min(1, "Name is required").max(255),
});

export const moveItemSchema = z.object({
  id: z.number(),
  type: z.enum(["file", "folder"]),
  destinationFolderId: z.number().nullable(),
});

export const deleteItemSchema = z.object({
  id: z.number(),
  type: z.enum(["file", "folder"]),
});

export const searchSchema = z.object({
  query: z.string(),
  type: z.enum(["all", "images", "documents", "videos", "audio"]).optional(),
  sort: z.enum(["name", "size", "date"]).optional(),
  folderId: z.number().optional().nullable(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Share = typeof shares.$inferSelect;
export type InsertShare = z.infer<typeof insertShareSchema>;

// Extended types for frontend
export type FileWithPath = File & { 
  breadcrumbs: Array<{ id: number; name: string }>;
  url?: string;
};

export type FolderWithPath = Folder & { 
  breadcrumbs: Array<{ id: number; name: string }>;
  itemCount: number;
};

// ValidationSchema
export const validation = {
  fileTypeSchema
};

export type FileAction = "rename" | "move" | "delete" | "share" | "favorite" | "restore";
