import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  insertUserSchema,
  loginUserSchema,
  registerUserSchema,
  registerApiSchema
} from '@shared/schema';

describe('Schema Validation', () => {
  describe('insertUserSchema', () => {
    it('should validate a valid user', () => {
      const validUser = {
        username: 'testuser',
        password: 'Password123!',
      };
      
      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject a user with missing fields', () => {
      const invalidUser = {
        username: 'testuser',
      };
      
      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('password');
      }
    });
  });

  describe('loginUserSchema', () => {
    it('should validate a valid login', () => {
      const validLogin = {
        username: 'testuser',
        password: 'Password123!',
      };
      
      const result = loginUserSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('should reject a login with empty fields', () => {
      const invalidLogin = {
        username: '',
        password: '',
      };
      
      const result = loginUserSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const fieldErrors = result.error.issues.map(issue => issue.path[0]);
        expect(fieldErrors).toContain('username');
        expect(fieldErrors).toContain('password');
      }
    });
  });

  describe('registerUserSchema', () => {
    it('should validate a valid registration', () => {
      const validRegistration = {
        username: 'testuser',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };
      
      const result = registerUserSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it('should reject when passwords do not match', () => {
      const invalidRegistration = {
        username: 'testuser',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword',
      };
      
      const result = registerUserSchema.safeParse(invalidRegistration);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('passwords must match');
      }
    });

    it('should reject when username is too short', () => {
      const invalidRegistration = {
        username: 'te',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };
      
      const result = registerUserSchema.safeParse(invalidRegistration);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('username');
      }
    });

    it('should reject when password does not meet complexity requirements', () => {
      const invalidRegistration = {
        username: 'testuser',
        password: 'password',
        confirmPassword: 'password',
      };
      
      const result = registerUserSchema.safeParse(invalidRegistration);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('password');
      }
    });
  });

  describe('registerApiSchema', () => {
    it('should validate a valid API registration', () => {
      const validRegistration = {
        username: 'testuser',
        password: 'Password123!',
      };
      
      const result = registerApiSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it('should reject when required fields are missing', () => {
      const invalidRegistration = {
        username: 'testuser',
      };
      
      const result = registerApiSchema.safeParse(invalidRegistration);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('password');
      }
    });
  });
});