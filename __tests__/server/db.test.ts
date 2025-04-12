import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as schema from '@shared/schema';

// Mock the pg pool
vi.mock('@neondatabase/serverless', () => ({
  Pool: vi.fn(() => ({
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  })),
  neonConfig: {
    webSocketConstructor: null,
  }
}));

// Mock ws
vi.mock('ws', () => ({
  default: vi.fn(),
}));

// Mock environment variable
vi.stubEnv('DATABASE_URL', 'postgresql://fake:fake@fake.db/fakedb');

describe('Database Connection', () => {
  beforeEach(() => {
    // Clear module cache before each test
    vi.resetModules();
  });

  it('should create a pool with the database URL', async () => {
    const { Pool } = await import('@neondatabase/serverless');
    const { pool } = await import('../../server/db');
    
    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgresql://fake:fake@fake.db/fakedb',
    });
    
    expect(pool).toBeDefined();
  });

  it('should throw an error if DATABASE_URL is not set', async () => {
    // Temporarily remove the DATABASE_URL
    vi.stubEnv('DATABASE_URL', '');
    
    await expect(import('../../server/db')).rejects.toThrow(
      'DATABASE_URL must be set'
    );
    
    // Restore the environment variable
    vi.stubEnv('DATABASE_URL', 'postgresql://fake:fake@fake.db/fakedb');
  });

  it('should setup drizzle with the correct schema', async () => {
    const { db } = await import('../../server/db');
    
    expect(db).toBeDefined();
    expect(db.query).toBeDefined();
    expect(db.select).toBeDefined();
    expect(db.insert).toBeDefined();
  });
});