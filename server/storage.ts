import { users, passwordResetTokens, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { pool } from "./db";
import crypto from "crypto";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: number, newPassword: string): Promise<boolean>;
  
  // Password reset
  createPasswordResetToken(userId: number): Promise<string>;
  getPasswordResetToken(token: string): Promise<{
    id: number;
    userId: number;
    token: string;
    expiresAt: Date;
    used: boolean;
  } | undefined>;
  markTokenAsUsed(tokenId: number): Promise<boolean>;
  
  // Session
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private passwordResetTokens: Map<number, {
    id: number;
    userId: number;
    token: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
  }>;
  currentId: number;
  currentTokenId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.passwordResetTokens = new Map();
    this.currentId = 1;
    this.currentTokenId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserPassword(userId: number, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }
    
    user.password = newPassword;
    this.users.set(userId, user);
    return true;
  }
  
  async createPasswordResetToken(userId: number): Promise<string> {
    // Check if user exists
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Create token record
    const id = this.currentTokenId++;
    const resetToken = {
      id,
      userId,
      token,
      expiresAt,
      used: false,
      createdAt: new Date(),
    };
    
    this.passwordResetTokens.set(id, resetToken);
    return token;
  }
  
  async getPasswordResetToken(token: string): Promise<{
    id: number;
    userId: number;
    token: string;
    expiresAt: Date;
    used: boolean;
  } | undefined> {
    return Array.from(this.passwordResetTokens.values()).find(
      (resetToken) => resetToken.token === token
    );
  }
  
  async markTokenAsUsed(tokenId: number): Promise<boolean> {
    const token = this.passwordResetTokens.get(tokenId);
    if (!token) {
      return false;
    }
    
    token.used = true;
    this.passwordResetTokens.set(tokenId, token);
    return true;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUserPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      const result = await db
        .update(users)
        .set({ password: newPassword })
        .where(eq(users.id, userId))
        .returning({ id: users.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Failed to update user password:', error);
      return false;
    }
  }
  
  async createPasswordResetToken(userId: number): Promise<string> {
    try {
      // Generate a random token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration time (1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Create the token record
      const [result] = await db
        .insert(passwordResetTokens)
        .values({
          userId,
          token,
          expiresAt,
          used: false,
        })
        .returning();
      
      return token;
    } catch (error) {
      console.error('Failed to create password reset token:', error);
      throw new Error('Failed to create password reset token');
    }
  }
  
  async getPasswordResetToken(token: string): Promise<{
    id: number;
    userId: number;
    token: string;
    expiresAt: Date;
    used: boolean;
  } | undefined> {
    try {
      const [result] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token));
      
      return result;
    } catch (error) {
      console.error('Failed to get password reset token:', error);
      return undefined;
    }
  }
  
  async markTokenAsUsed(tokenId: number): Promise<boolean> {
    try {
      const result = await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, tokenId))
        .returning({ id: passwordResetTokens.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Failed to mark token as used:', error);
      return false;
    }
  }
}

// Switch from memory storage to database storage
export const storage = new DatabaseStorage();
