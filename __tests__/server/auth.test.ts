import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express, Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { mockUsers, mockInsertUser } from '../mocks/data';
import { setupAuth } from '../../server/auth';
import { IStorage } from '../../server/storage';
import session from 'express-session';
import passport from 'passport';

// Mock the crypto module
vi.mock('crypto', () => ({
  scrypt: vi.fn((password, salt, keylen, callback) => {
    callback(null, Buffer.from('hashed_password'));
  }),
  randomBytes: vi.fn(() => ({
    toString: () => 'random_salt',
  })),
  timingSafeEqual: vi.fn(() => true),
}));

// Mock the storage
const mockStorage: IStorage = {
  getUser: vi.fn(async (id: number) => {
    return mockUsers.find(user => user.id === id);
  }),
  getUserByUsername: vi.fn(async (username: string) => {
    return mockUsers.find(user => user.username === username);
  }),
  createUser: vi.fn(async (userData) => {
    return { ...userData, id: 1 };
  }),
  sessionStore: {},
};

vi.mock('../../server/storage', () => ({
  storage: mockStorage,
}));

// Mock passport
vi.mock('passport', () => ({
  default: {
    initialize: vi.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
    session: vi.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
    use: vi.fn(),
    authenticate: vi.fn(() => (req: Request, res: Response, next: NextFunction) => {
      // Simulate successful authentication
      req.user = mockUsers[0];
      next();
    }),
    serializeUser: vi.fn(),
    deserializeUser: vi.fn(),
  },
}));

// Mock express-session
vi.mock('express-session', () => {
  return vi.fn(() => (req: Request, res: Response, next: NextFunction) => {
    next();
  });
});

describe('Auth Module', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    setupAuth(app);
  });

  describe('POST /api/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/register')
        .send(mockInsertUser);
      
      expect(response.status).toBe(201);
      expect(mockStorage.createUser).toHaveBeenCalledWith(expect.objectContaining({
        username: mockInsertUser.username,
        password: expect.any(String), // Password should be hashed
      }));
      expect(response.body).toEqual(expect.objectContaining({
        id: 1,
        username: mockInsertUser.username,
      }));
    });

    it('should return 400 if username already exists', async () => {
      // Mock user already exists
      vi.mocked(mockStorage.getUserByUsername).mockResolvedValueOnce(mockUsers[0]);
      
      const response = await request(app)
        .post('/api/register')
        .send(mockInsertUser);
      
      expect(response.status).toBe(400);
      expect(response.text).toContain('Username already exists');
    });
  });

  describe('POST /api/login', () => {
    it('should authenticate a user', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: mockInsertUser.username,
          password: mockInsertUser.password,
        });
      
      expect(response.status).toBe(200);
      expect(passport.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /api/logout', () => {
    it('should log out a user', async () => {
      // Mock req.logout
      app.use((req, res, next) => {
        req.logout = (callback) => {
          callback(null);
        };
        next();
      });
      
      const response = await request(app)
        .post('/api/logout');
      
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/user', () => {
    it('should return user data if authenticated', async () => {
      // Mock authenticated request
      app.use((req, res, next) => {
        req.isAuthenticated = () => true;
        req.user = mockUsers[0];
        next();
      });
      
      const response = await request(app)
        .get('/api/user');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers[0]);
    });

    it('should return 401 if not authenticated', async () => {
      // Mock unauthenticated request
      app.use((req, res, next) => {
        req.isAuthenticated = () => false;
        next();
      });
      
      const response = await request(app)
        .get('/api/user');
      
      expect(response.status).toBe(401);
    });
  });
});