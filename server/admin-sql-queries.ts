import postgres from 'postgres';
import { log } from './vite';

// Get a reference to the postgres client
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export async function getAdminUsers(
  query?: string,
  role?: string,
  sortBy: string = 'username',
  sortDirection: string = 'asc',
  page: number = 1,
  limit: number = 20
): Promise<{ users: any[], total: number }> {
  try {
    const pageSize = limit;
    const skip = (page - 1) * pageSize;
    
    // Build simple where conditions for direct SQL
    const conditions = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (query) {
      conditions.push(`(username ILIKE $${paramIndex})`);
      params.push(`%${query}%`);
      paramIndex++;
    }
    
    if (role) {
      conditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }
    
    // Build where clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
    // Build order by clause
    let orderByClause = 'ORDER BY ';
    
    if (sortBy === 'username') {
      orderByClause += `username ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
    } else if (sortBy === 'storageUsed') {
      orderByClause += `"storageUsed" ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
    } else {
      orderByClause += `"createdAt" ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
    }
    
    // Build user query with pagination
    const usersQuery = `
      SELECT * FROM users
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(pageSize, skip);
    
    // Execute the SQL query
    const usersResult = await client.query(usersQuery, params);
    const usersList = usersResult.rows;
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM users
      ${whereClause}
    `;
    
    const countResult = await client.query(countQuery, params.slice(0, paramIndex - 1));
    const total = parseInt(countResult.rows[0].total.toString());
    
    return { 
      users: usersList,
      total
    };
  } catch (error) {
    log(`Error in getAdminUsers SQL: ${error}`, "admin");
    throw error;
  }
}

export async function getUserFileCountMap(userIds: number[]): Promise<Map<number, number>> {
  try {
    if (userIds.length === 0) {
      return new Map<number, number>();
    }
    
    // Convert the user IDs array to a comma-separated string for the IN clause
    const userIdsStr = userIds.join(',');
    
    // Query to get file counts for each user
    const query = `
      SELECT "userId", COUNT(*) as file_count 
      FROM files 
      WHERE "userId" IN (${userIdsStr}) 
      GROUP BY "userId"
    `;
    
    const result = await client.query(query);
    
    // Create a map of user ID to file count
    const fileCountMap = new Map<number, number>();
    result.forEach((row: any) => {
      fileCountMap.set(parseInt(row.userId), parseInt(row.file_count));
    });
    
    return fileCountMap;
  } catch (error) {
    log(`Error in getUserFileCountMap SQL: ${error}`, "admin");
    throw error;
  }
}