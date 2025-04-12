import { User, InsertUser, LoginUser } from '@shared/schema';

export const mockUsers: User[] = [
  {
    id: 1,
    username: 'testuser1',
    password: 'hashed_password_1',
  },
  {
    id: 2,
    username: 'testuser2',
    password: 'hashed_password_2',
  },
];

export const mockInsertUser: InsertUser = {
  username: 'newuser',
  password: 'Password123!',
};

export const mockLoginUser: LoginUser = {
  username: 'testuser1',
  password: 'Password123!',
};

export const mockInvalidLoginUser: LoginUser = {
  username: 'nonexistent',
  password: 'wrongpassword',
};

export const mockRegisterUser = {
  username: 'newuser',
  password: 'Password123!',
  confirmPassword: 'Password123!',
};

export const mockInvalidRegisterUser = {
  username: 'u',  // Too short
  password: 'short',  // No special chars or numbers
  confirmPassword: 'different',  // Doesn't match
};