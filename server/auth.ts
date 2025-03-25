import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users } from "@shared/schema";
import { log } from "./vite";

// Type declaration for Express session
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      fullName: string | null;
      storageUsed: number;
      storageLimit: number;
      avatarUrl: string | null;
    }
  }
}

// Create PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Initialize scrypt as a promise
const scryptAsync = promisify(scrypt);

// Hash a password with a random salt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare a password with a hashed one
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Setup authentication and session handling
export function setupAuth(app: Express) {
  // Configure session
  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dropstore-session-secret',
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionOptions));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport with local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        
        if (!user) {
          return done(null, false, { message: "User not found" });
        }
        
        const isValid = await comparePasswords(password, user.password);
        
        if (!isValid) {
          return done(null, false, { message: "Invalid password" });
        }
        
        // Don't include password in the user object that gets serialized
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        log(`Authentication error: ${error}`, 'auth');
        return done(error);
      }
    })
  );

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        storageUsed: users.storageUsed,
        storageLimit: users.storageLimit,
        avatarUrl: users.avatarUrl
      }).from(users).where(eq(users.id, id));
      
      done(null, user || undefined);
    } catch (error) {
      log(`Deserialization error: ${error}`, 'auth');
      done(error);
    }
  });

  // Log authentication setup
  log('Authentication system initialized', 'auth');
}