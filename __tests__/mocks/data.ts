import { InsertUser, LoginUser, User } from '@shared/schema';

export const mockUsers: User[] = [
  {
    id: 1,
    username: 'testuser1',
    password: 'hashedPassword1.salt',
  },
  {
    id: 2,
    username: 'testuser2',
    password: 'hashedPassword2.salt',
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
  username: 'nonexistentuser',
  password: 'invalidpassword',
};

export const mockRegisterUser = {
  username: 'newuser',
  password: 'Password123!',
  confirmPassword: 'Password123!',
};

export const mockInvalidRegisterUser = {
  username: 'nu',
  password: 'weak',
  confirmPassword: 'doesntmatch',
};