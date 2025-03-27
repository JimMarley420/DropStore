import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { fileTypeSchema } from "./validation";

// Enum for file permissions
export const filePermissionEnum = pgEnum('file_permission', ['view', 'edit', 'full']);

// Enum for file status
export const fileStatusEnum = pgEnum('file_status', ['active', 'trashed', 'deleted']);

// Enum for theme appearance
export const themeAppearanceEnum = pgEnum('theme_appearance', ['light', 'dark', 'system']);

// Enum for theme variant
export const themeVariantEnum = pgEnum('theme_variant', ['professional', 'tint', 'vibrant']);

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin', 'superadmin']);

// Enum for permission actions
export const permissionActionEnum = pgEnum('permission_action', ['read', 'write', 'delete', 'manage']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  password: text("password").notNull(),
  storageUsed: integer("storage_used").notNull().default(0),
  storageLimit: integer("storage_limit").notNull().default(2000000000), // ~2GB default
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User themes table
export const userThemes = pgTable("user_themes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  primaryColor: text("primary_color").notNull().default("#4f46e5"),
  appearance: themeAppearanceEnum("appearance").default("system").notNull(),
  variant: themeVariantEnum("variant").default("professional").notNull(),
  radius: integer("radius").notNull().default(8),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
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

// User permissions table
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  action: permissionActionEnum("action").notNull(),
  resource: text("resource").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Role permissions table (many-to-many)
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: userRoleEnum("role").notNull(),
  permissionId: integer("permission_id").notNull().references(() => permissions.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Admin activity logs
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow()
});

// Validation schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  fullName: true,
  password: true,
});

// User theme schema
export const insertUserThemeSchema = createInsertSchema(userThemes).pick({
  userId: true,
  primaryColor: true,
  appearance: true,
  variant: true,
  radius: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register schema with validation
export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User profile update schema
export const updateProfileSchema = z.object({
  fullName: z.string().nullable().optional(),
  email: z.string().email("Please enter a valid email address"),
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

// Admin schemas
export const insertPermissionSchema = createInsertSchema(permissions).pick({
  name: true,
  description: true,
  action: true,
  resource: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).pick({
  role: true,
  permissionId: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).pick({
  userId: true,
  action: true,
  targetType: true,
  targetId: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

export const updateUserRoleSchema = z.object({
  userId: z.number(),
  role: z.enum(["user", "moderator", "admin", "superadmin"]),
});

export const adminUserSearchSchema = z.object({
  query: z.string().optional(),
  role: z.enum(["user", "moderator", "admin", "superadmin"]).optional(),
  sortBy: z.enum(["createdAt", "username", "storageUsed"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  page: z.union([z.string(), z.number()]).optional().transform(val => 
    val === undefined ? 1 : Number(val)
  ),
  limit: z.union([z.string(), z.number()]).optional().transform(val => 
    val === undefined ? 20 : Number(val)
  ),
});

export const adminUserActionSchema = z.object({
  userId: z.number(),
  action: z.enum(["activate", "deactivate", "resetPassword", "updateRole", "updateStorage"]),
  data: z.record(z.any()).optional(),
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

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;

export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;
export type AdminUserAction = z.infer<typeof adminUserActionSchema>;

// Schéma pour la personnalisation du thème
export const updateUserThemeSchema = z.object({
  primaryColor: z.string().regex(/^#([0-9A-F]{6})$/i, "Must be a valid hex color code"),
  appearance: z.enum(["light", "dark", "system"]),
  variant: z.enum(["professional", "tint", "vibrant"]),
  radius: z.number().min(0).max(24),
});

// Extended types for frontend
export type FileWithPath = File & { 
  breadcrumbs: Array<{ id: number; name: string }>;
  url?: string;
};

export type FolderWithPath = Folder & { 
  breadcrumbs: Array<{ id: number; name: string }>;
  itemCount: number;
};

export type UserTheme = typeof userThemes.$inferSelect;
export type InsertUserTheme = z.infer<typeof insertUserThemeSchema>;
export type UpdateUserTheme = z.infer<typeof updateUserThemeSchema>;

// ValidationSchema
export const validation = {
  fileTypeSchema
};

export type FileAction = "rename" | "move" | "delete" | "share" | "favorite" | "restore";
