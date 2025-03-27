import { Router, Request, Response } from "express";
import { eq, desc, asc, sql, and, like, or, isNull } from "drizzle-orm";
import { db } from "./db";
import { User, users, files, folders, shares, adminLogs, adminUserSearchSchema, adminUserActionSchema, updateUserRoleSchema } from "@shared/schema";
import { isAdmin, hasRole, logAdminAction } from "./auth";
import { hashPassword } from "./auth";
import { log } from "./vite";
import { randomBytes } from "crypto";

// Create an admin router
const adminRouter = Router();

// Middleware to ensure all routes in this router are protected
adminRouter.use(isAdmin);

// Get system stats
adminRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    // Get total users count
    const [{ count: totalUsers }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    // Get total active users count
    const [{ count: activeUsers }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    // Get total files count
    const [{ count: totalFiles }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(files);

    // Get total storage used
    const [{ totalStorage }] = await db
      .select({ totalStorage: sql<number>`sum(${users.storageUsed})` })
      .from(users);

    // Get total shares count
    const [{ count: totalShares }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shares);

    // Get total folders count
    const [{ count: totalFolders }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(folders);

    // Get recent activity (last 10 admin actions)
    const recentActivity = await db
      .select({
        id: adminLogs.id,
        userId: adminLogs.userId,
        action: adminLogs.action,
        targetType: adminLogs.targetType,
        targetId: adminLogs.targetId,
        details: adminLogs.details,
        createdAt: adminLogs.createdAt
      })
      .from(adminLogs)
      .orderBy(desc(adminLogs.createdAt))
      .limit(10);

    // Get user activity by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Format for datetime comparison in SQL
    const formattedDate = thirtyDaysAgo.toISOString();

    const userActivity = await db
      .select({
        date: sql<string>`DATE_TRUNC('day', ${users.lastLoginAt})::date`,
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(sql`${users.lastLoginAt} >= ${formattedDate}`)
      .groupBy(sql`DATE_TRUNC('day', ${users.lastLoginAt})::date`)
      .orderBy(sql`DATE_TRUNC('day', ${users.lastLoginAt})::date`);

    // Return all stats
    return res.status(200).json({
      users: {
        total: totalUsers,
        active: activeUsers
      },
      files: totalFiles,
      folders: totalFolders,
      shares: totalShares,
      storage: {
        used: totalStorage || 0
      },
      recentActivity,
      userActivity
    });
  } catch (error) {
    log(`Error fetching admin stats: ${error}`, "admin");
    return res.status(500).json({ message: "Failed to fetch admin statistics" });
  }
});

// Get all users with pagination and search
adminRouter.get("/users", async (req: Request, res: Response) => {
  try {
    const validation = adminUserSearchSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid query parameters", errors: validation.error.format() });
    }
    
    const { query, role, sortBy, sortDirection, page, limit } = validation.data;
    
    const pageNum = page || 1;
    const pageSize = limit || 20;
    const skip = (pageNum - 1) * pageSize;
    
    // Build where clause
    let whereClause = undefined;
    
    if (query) {
      whereClause = or(
        like(users.username, `%${query}%`),
        like(users.email, `%${query}%`),
        users.fullName ? like(users.fullName, `%${query}%`) : isNull(users.fullName)
      );
    }
    
    if (role) {
      whereClause = whereClause 
        ? and(whereClause, eq(users.role, role)) 
        : eq(users.role, role);
    }

    // Get all users with search and pagination
    const usersList = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(
        sortBy === 'username' 
          ? sortDirection === 'desc' ? desc(users.username) : asc(users.username)
          : sortBy === 'storageUsed'
            ? sortDirection === 'desc' ? desc(users.storageUsed) : asc(users.storageUsed)
            : sortDirection === 'desc' ? desc(users.createdAt) : asc(users.createdAt)
      )
      .limit(pageSize)
      .offset(skip);

    // Get total count for pagination
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);

    // Get file count per user
    const userIds = usersList.map(user => user.id);
    
    // Assurez-vous que tous les IDs sont des nombres
    const userIdsNumbers = userIds.map(id => Number(id));
    
    const fileCountsResult = await db
      .select({
        userId: files.userId,
        count: sql<number>`count(*)`
      })
      .from(files)
      .where(sql`${files.userId} = ANY(ARRAY[${userIdsNumbers}]::integer[])`)
      .groupBy(files.userId);

    // Create a map of user ID to file count
    const fileCountMap = new Map<number, number>();
    fileCountsResult.forEach(result => {
      fileCountMap.set(result.userId, result.count);
    });

    // Map users with file counts
    const usersWithStats = usersList.map(user => {
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        fileCount: fileCountMap.get(user.id) || 0
      };
    });

    // Log the admin action
    await logAdminAction(
      req.user!.id, 
      "list_users", 
      "users", 
      undefined, 
      `Admin viewed users list with query: ${query || "none"}`,
      req
    );

    return res.status(200).json({
      users: usersWithStats,
      pagination: {
        total,
        page: pageNum,
        pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    log(`Error fetching users: ${error}`, "admin");
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get a specific user by ID
adminRouter.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    
    // Get user's file count
    const [{ count: fileCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(files)
      .where(eq(files.userId, userId));
    
    // Get user's latest login
    const userWithStats = {
      ...userWithoutPassword,
      fileCount
    };

    // Log the admin action
    await logAdminAction(
      req.user!.id, 
      "view_user", 
      "users", 
      userId, 
      `Admin viewed user details for: ${user.username}`,
      req
    );
    
    return res.status(200).json(userWithStats);
  } catch (error) {
    log(`Error fetching user: ${error}`, "admin");
    return res.status(500).json({ message: "Failed to fetch user details" });
  }
});

// Perform action on a user (activate, deactivate, reset password, update role, update storage)
adminRouter.post("/users/:id/actions", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const validation = adminUserActionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid request data", errors: validation.error.format() });
    }
    
    const { action, data } = validation.data;
    
    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if attempting to modify a superadmin (only superadmins can modify other superadmins)
    if (user.role === 'superadmin' && req.user!.role !== 'superadmin') {
      return res.status(403).json({ message: "Insufficient permissions to modify a superadmin" });
    }
    
    // Execute the requested action
    switch (action) {
      case 'activate':
        await db
          .update(users)
          .set({ isActive: true })
          .where(eq(users.id, userId));
        
        await logAdminAction(
          req.user!.id, 
          "activate_user", 
          "users", 
          userId, 
          `Admin activated user: ${user.username}`,
          req
        );
        
        return res.status(200).json({ message: "User activated successfully" });
        
      case 'deactivate':
        await db
          .update(users)
          .set({ isActive: false })
          .where(eq(users.id, userId));
        
        await logAdminAction(
          req.user!.id, 
          "deactivate_user", 
          "users", 
          userId, 
          `Admin deactivated user: ${user.username}`,
          req
        );
        
        return res.status(200).json({ message: "User deactivated successfully" });
        
      case 'resetPassword':
        // Generate a random password
        const newPassword = randomBytes(8).toString('hex');
        const hashedPassword = await hashPassword(newPassword);
        
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, userId));
        
        await logAdminAction(
          req.user!.id, 
          "reset_password", 
          "users", 
          userId, 
          `Admin reset password for user: ${user.username}`,
          req
        );
        
        return res.status(200).json({ 
          message: "Password reset successfully", 
          newPassword 
        });
        
      case 'updateRole':
        const roleValidation = updateUserRoleSchema.safeParse(data);
        
        if (!roleValidation.success) {
          return res.status(400).json({ message: "Invalid role data", errors: roleValidation.error.format() });
        }
        
        // Check if attempting to create a superadmin (only superadmins can create other superadmins)
        if (roleValidation.data.role === 'superadmin' && req.user!.role !== 'superadmin') {
          return res.status(403).json({ message: "Insufficient permissions to create a superadmin" });
        }
        
        await db
          .update(users)
          .set({ role: roleValidation.data.role })
          .where(eq(users.id, userId));
        
        await logAdminAction(
          req.user!.id, 
          "update_role", 
          "users", 
          userId, 
          `Admin updated role to ${roleValidation.data.role} for user: ${user.username}`,
          req
        );
        
        return res.status(200).json({ message: "User role updated successfully" });
        
      case 'updateStorage':
        // Validate storage limit is a number
        if (!data || typeof data.storageLimit !== 'number' || data.storageLimit < 0) {
          return res.status(400).json({ message: "Invalid storage limit" });
        }
        
        await db
          .update(users)
          .set({ storageLimit: data.storageLimit })
          .where(eq(users.id, userId));
        
        await logAdminAction(
          req.user!.id, 
          "update_storage", 
          "users", 
          userId, 
          `Admin updated storage limit to ${data.storageLimit} bytes for user: ${user.username}`,
          req
        );
        
        return res.status(200).json({ message: "User storage limit updated successfully" });
        
      default:
        return res.status(400).json({ message: "Unsupported action" });
    }
  } catch (error) {
    log(`Error performing user action: ${error}`, "admin");
    return res.status(500).json({ message: "Failed to perform action on user" });
  }
});

// Get admin logs with pagination and filtering
adminRouter.get("/logs", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const action = req.query.action as string | undefined;
    const skip = (page - 1) * limit;
    
    // Build where clause
    let whereClause = undefined;
    
    if (userId) {
      whereClause = eq(adminLogs.userId, userId);
    }
    
    if (action) {
      whereClause = whereClause 
        ? and(whereClause, eq(adminLogs.action, action)) 
        : eq(adminLogs.action, action);
    }
    
    // Get logs with pagination
    const logs = await db
      .select({
        id: adminLogs.id,
        userId: adminLogs.userId,
        action: adminLogs.action,
        targetType: adminLogs.targetType,
        targetId: adminLogs.targetId,
        details: adminLogs.details,
        ipAddress: adminLogs.ipAddress,
        userAgent: adminLogs.userAgent,
        createdAt: adminLogs.createdAt
      })
      .from(adminLogs)
      .where(whereClause)
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit)
      .offset(skip);
    
    // Get total count for pagination
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminLogs)
      .where(whereClause);
    
    // Get unique usernames for user IDs in logs
    const userIdsInLogs = logs.map(log => log.userId);
    const uniqueUserIdsInLogs = Array.from(new Set(userIdsInLogs));
    
    // Assurez-vous que tous les IDs sont des nombres
    const userIdsInLogsNumbers = uniqueUserIdsInLogs.map(id => Number(id));
    
    const usernames = await db
      .select({
        id: users.id,
        username: users.username
      })
      .from(users)
      .where(sql`${users.id} = ANY(ARRAY[${userIdsInLogsNumbers}]::integer[])`);
    
    // Create a map of user ID to username
    const usernameMap = new Map<number, string>();
    usernames.forEach(user => {
      usernameMap.set(user.id, user.username);
    });
    
    // Map logs with usernames
    const logsWithUsernames = logs.map(log => ({
      ...log,
      username: usernameMap.get(log.userId) || 'Unknown'
    }));
    
    // Log the admin action
    await logAdminAction(
      req.user!.id, 
      "view_logs", 
      "logs", 
      undefined, 
      `Admin viewed activity logs`,
      req
    );
    
    return res.status(200).json({
      logs: logsWithUsernames,
      pagination: {
        total,
        page,
        pageSize: limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    log(`Error fetching admin logs: ${error}`, "admin");
    return res.status(500).json({ message: "Failed to fetch admin logs" });
  }
});

// Get file statistics and management
adminRouter.get("/files", async (req: Request, res: Response) => {
  try {
    // Get file statistics by type
    const fileTypeStats = await db
      .select({
        type: files.type,
        count: sql<number>`count(*)`,
        totalSize: sql<number>`sum(${files.size})`
      })
      .from(files)
      .groupBy(files.type)
      .orderBy(desc(sql<number>`count(*)`));
    
    // Get total number of files
    const [{ count: totalFiles }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(files);
    
    // Get total storage used
    const [{ totalSize }] = await db
      .select({ totalSize: sql<number>`sum(${files.size})` })
      .from(files);
    
    // Get files by status
    const filesByStatus = await db
      .select({
        status: files.status,
        count: sql<number>`count(*)`
      })
      .from(files)
      .groupBy(files.status);
    
    // Get largest files
    const largestFiles = await db
      .select({
        id: files.id,
        name: files.name,
        size: files.size,
        type: files.type,
        userId: files.userId
      })
      .from(files)
      .orderBy(desc(files.size))
      .limit(10);
    
    // Get usernames for user IDs in largest files
    const userIdsInFiles = largestFiles.map(file => file.userId);
    const uniqueUserIdsInFiles = Array.from(new Set(userIdsInFiles));
    
    // Assurez-vous que tous les IDs sont des nombres
    const userIdsInFilesNumbers = uniqueUserIdsInFiles.map(id => Number(id));
    
    const usernames = await db
      .select({
        id: users.id,
        username: users.username
      })
      .from(users)
      .where(sql`${users.id} = ANY(ARRAY[${userIdsInFilesNumbers}]::integer[])`);
    
    // Create a map of user ID to username
    const usernameMap = new Map<number, string>();
    usernames.forEach(user => {
      usernameMap.set(user.id, user.username);
    });
    
    // Map largest files with usernames
    const largestFilesWithUsernames = largestFiles.map(file => ({
      ...file,
      username: usernameMap.get(file.userId) || 'Unknown'
    }));

    // Log the admin action
    await logAdminAction(
      req.user!.id, 
      "view_file_stats", 
      "files", 
      undefined, 
      `Admin viewed file statistics`,
      req
    );
    
    return res.status(200).json({
      total: {
        files: totalFiles,
        size: totalSize || 0
      },
      byType: fileTypeStats,
      byStatus: filesByStatus,
      largestFiles: largestFilesWithUsernames
    });
  } catch (error) {
    log(`Error fetching file statistics: ${error}`, "admin");
    return res.status(500).json({ message: "Failed to fetch file statistics" });
  }
});

export default adminRouter;