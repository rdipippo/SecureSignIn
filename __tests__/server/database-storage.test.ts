import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockUsers, mockInsertUser } from '../mocks/data';
import { DatabaseStorage } from '../../server/storage';

// Mock the db module
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([mockUsers[0]]),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ ...mockInsertUser, id: 1 }]),
      })),
    })),
  },
  pool: {},
}));

// Mock connect-pg-simple
vi.mock('connect-pg-simple', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return function() {
        return function(options: any) {
          return {};
        };
      };
    }),
  };
});

describe('DatabaseStorage', () => {
  let storage: DatabaseStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new DatabaseStorage();
  });

  describe('getUser', () => {
    it('should retrieve a user by ID', async () => {
      const user = await storage.getUser(1);
      expect(user).toEqual(mockUsers[0]);
    });

    it('should return undefined if no user is found', async () => {
      // Override the mock for this test
      const { db } = require('../../server/db');
      db.select.mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      }));
      
      const user = await storage.getUser(999);
      expect(user).toBeUndefined();
    });
  });

  describe('getUserByUsername', () => {
    it('should retrieve a user by username', async () => {
      const user = await storage.getUserByUsername('testuser1');
      expect(user).toEqual(mockUsers[0]);
    });

    it('should return undefined if no user is found', async () => {
      // Override the mock for this test
      const { db } = require('../../server/db');
      db.select.mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      }));
      
      const user = await storage.getUserByUsername('nonexistent');
      expect(user).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('should create a new user and return it', async () => {
      const newUser = await storage.createUser(mockInsertUser);
      
      expect(newUser).toEqual({
        ...mockInsertUser,
        id: 1,
      });
    });
  });

  describe('sessionStore', () => {
    it('should create a session store', () => {
      expect(storage.sessionStore).toBeDefined();
    });
  });
});