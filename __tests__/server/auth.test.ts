import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockUsers, mockInsertUser, mockLoginUser } from '../mocks/data';
import express, { Express } from 'express';
import session from 'express-session';
import request from 'supertest';
import passport from 'passport';
import { setupAuth } from '../../server/auth';
import { IStorage } from '../../server/storage';

// Mock the storage
const mockStorage: IStorage = {
  getUser: vi.fn(),
  getUserByUsername: vi.fn(),
  createUser: vi.fn(),
  sessionStore: {} as session.Store,
};

// Mock the crypto utils
vi.mock('crypto', () => ({
  scrypt: vi.fn((password, salt, keylen, callback) => {
    callback(null, Buffer.from('hashed_' + password));
  }),
  randomBytes: vi.fn(() => ({ toString: () => 'random_salt' })),
  timingSafeEqual: vi.fn(() => true),
}));

// Mock the passport module
vi.mock('passport', () => ({
  default: {
    initialize: vi.fn(() => (req: any, res: any, next: any) => next()),
    session: vi.fn(() => (req: any, res: any, next: any) => next()),
    use: vi.fn(),
    authenticate: vi.fn(() => (req: any, res: any, next: any) => {
      req.user = { ...mockUsers[0], password: undefined };
      next();
    }),
    serializeUser: vi.fn((fn) => fn(mockUsers[0], (err: any, id: any) => {})),
    deserializeUser: vi.fn((fn) => fn(1, (err: any, user: any) => {})),
  },
  Strategy: vi.fn(),
}));

describe('Auth Routes', () => {
  let app: Express;

  beforeEach(() => {
    // Reset mock functions
    vi.resetAllMocks();
    
    // Configure mock storage
    (mockStorage.getUserByUsername as any).mockImplementation((username: string) => {
      return Promise.resolve(mockUsers.find(u => u.username === username));
    });
    
    (mockStorage.getUser as any).mockImplementation((id: number) => {
      return Promise.resolve(mockUsers.find(u => u.id === id));
    });
    
    (mockStorage.createUser as any).mockImplementation((user: any) => {
      return Promise.resolve({ ...user, id: mockUsers.length + 1 });
    });
    
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    
    // Mock req.login and req.logout
    app.use((req: any, res, next) => {
      req.login = vi.fn((user, cb) => cb());
      req.logout = vi.fn((cb) => cb());
      req.isAuthenticated = vi.fn(() => true);
      next();
    });
    
    // Set up auth routes
    setupAuth(app);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/register', () => {
    it('should register a new user and return it without the password', async () => {
      (mockStorage.getUserByUsername as any).mockResolvedValueOnce(undefined);
      
      const res = await request(app)
        .post('/api/register')
        .send({
          username: 'newuser',
          password: 'Password123!'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username', 'newuser');
      expect(res.body).not.toHaveProperty('password');
      expect(mockStorage.createUser).toHaveBeenCalled();
    });

    it('should return 400 if the username already exists', async () => {
      (mockStorage.getUserByUsername as any).mockResolvedValueOnce(mockUsers[0]);
      
      const res = await request(app)
        .post('/api/register')
        .send({
          username: 'existinguser',
          password: 'Password123!'
        });
      
      expect(res.status).toBe(400);
      expect(mockStorage.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          username: 'u', // Too short
          password: 'short'
        });
      
      expect(res.status).toBe(400);
      expect(mockStorage.createUser).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/login', () => {
    it('should log in an existing user and return the user without password', async () => {
      const res = await request(app)
        .post('/api/login')
        .send(mockLoginUser);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username');
      expect(res.body).not.toHaveProperty('password');
    });
  });

  describe('POST /api/logout', () => {
    it('should log out the user', async () => {
      const res = await request(app)
        .post('/api/logout');
      
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/user', () => {
    it('should return the current user if authenticated', async () => {
      const res = await request(app)
        .get('/api/user');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 if not authenticated', async () => {
      app.use((req: any, res, next) => {
        req.isAuthenticated = vi.fn(() => false);
        next();
      });
      
      const res = await request(app)
        .get('/api/user');
      
      expect(res.status).toBe(401);
    });
  });
});