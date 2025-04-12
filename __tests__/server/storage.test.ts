import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User, InsertUser } from '@shared/schema';
import { mockUsers, mockInsertUser } from '../mocks/data';
import { MemStorage } from '../../server/storage';

// Mock the express-session and memorystore modules
vi.mock('express-session', () => ({
  default: {},
}));

vi.mock('memorystore', () => ({
  default: () => {
    return () => ({});
  },
}));

describe('MemStorage', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    
    // Manually add mock users to the storage
    mockUsers.forEach(user => {
      // @ts-expect-error - Accessing private property for testing
      storage.users.set(user.id, user);
    });
    
    // Set the current ID to be after our mock users
    // @ts-expect-error - Accessing private property for testing
    storage.currentId = mockUsers.length + 1;
  });

  describe('getUser', () => {
    it('should return a user by ID if it exists', async () => {
      const user = await storage.getUser(1);
      expect(user).toEqual(mockUsers[0]);
    });

    it('should return undefined if user does not exist', async () => {
      const user = await storage.getUser(999);
      expect(user).toBeUndefined();
    });
  });

  describe('getUserByUsername', () => {
    it('should return a user by username if it exists', async () => {
      const user = await storage.getUserByUsername('testuser1');
      expect(user).toEqual(mockUsers[0]);
    });

    it('should return undefined if username does not exist', async () => {
      const user = await storage.getUserByUsername('nonexistentuser');
      expect(user).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('should create a new user and return it', async () => {
      const newUser = await storage.createUser(mockInsertUser);
      
      expect(newUser).toEqual({
        ...mockInsertUser,
        id: mockUsers.length + 1,
      });
      
      // Verify user was added to storage
      const retrievedUser = await storage.getUser(newUser.id);
      expect(retrievedUser).toEqual(newUser);
    });

    it('should increment the ID counter', async () => {
      const user1 = await storage.createUser({ ...mockInsertUser, username: 'user1' });
      const user2 = await storage.createUser({ ...mockInsertUser, username: 'user2' });
      
      expect(user2.id).toBe(user1.id + 1);
    });
  });
});