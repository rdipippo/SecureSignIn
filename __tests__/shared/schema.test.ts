import { describe, it, expect } from 'vitest';
import { 
  insertUserSchema, 
  loginUserSchema, 
  registerUserSchema,
  registerApiSchema
} from '@shared/schema';
import { mockRegisterUser, mockInvalidRegisterUser } from '../mocks/data';

describe('Schema Validation', () => {
  // Insert User Schema
  describe('insertUserSchema', () => {
    it('should validate a valid user', () => {
      const validUser = {
        username: 'testuser',
        password: 'Password123!'
      };
      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject a user with missing fields', () => {
      const invalidUser = {
        username: 'testuser'
      };
      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  // Login User Schema
  describe('loginUserSchema', () => {
    it('should validate a valid login', () => {
      const validLogin = {
        username: 'testuser',
        password: 'Password123!'
      };
      const result = loginUserSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('should reject a login with short username', () => {
      const invalidLogin = {
        username: 'te',
        password: 'Password123!'
      };
      const result = loginUserSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it('should reject a login with short password', () => {
      const invalidLogin = {
        username: 'testuser',
        password: 'pass'
      };
      const result = loginUserSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });

  // Register User Schema
  describe('registerUserSchema', () => {
    it('should validate a valid registration', () => {
      const result = registerUserSchema.safeParse(mockRegisterUser);
      expect(result.success).toBe(true);
    });

    it('should reject registration with password mismatch', () => {
      const invalidRegistration = {
        ...mockRegisterUser,
        confirmPassword: 'DifferentPassword123!'
      };
      const result = registerUserSchema.safeParse(invalidRegistration);
      expect(result.success).toBe(false);
    });

    it('should reject registration with invalid password format', () => {
      const invalidRegistration = {
        ...mockRegisterUser,
        password: 'password',
        confirmPassword: 'password'
      };
      const result = registerUserSchema.safeParse(invalidRegistration);
      expect(result.success).toBe(false);
    });

    it('should reject registration with short username', () => {
      const invalidRegistration = {
        ...mockRegisterUser,
        username: 'ab'
      };
      const result = registerUserSchema.safeParse(invalidRegistration);
      expect(result.success).toBe(false);
    });

    it('should reject completely invalid registration data', () => {
      const result = registerUserSchema.safeParse(mockInvalidRegisterUser);
      expect(result.success).toBe(false);
    });
  });

  // Register API Schema
  describe('registerApiSchema', () => {
    it('should validate a valid registration without confirmPassword', () => {
      const validRegistration = {
        username: 'testuser',
        password: 'Password123!'
      };
      const result = registerApiSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it('should reject registration with invalid password format', () => {
      const invalidRegistration = {
        username: 'testuser',
        password: 'password'
      };
      const result = registerApiSchema.safeParse(invalidRegistration);
      expect(result.success).toBe(false);
    });
  });
});