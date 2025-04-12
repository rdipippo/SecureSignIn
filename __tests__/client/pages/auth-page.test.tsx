import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../mocks/test-utils';
import AuthPage from '@/pages/auth-page';
import { mockRegisterUser } from '../../mocks/data';

// Mock the useAuth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isLoading: false,
    loginMutation: {
      isPending: false,
      mutate: vi.fn(),
      error: null,
    },
    registerMutation: {
      isPending: false,
      mutate: vi.fn(),
      error: null,
    }
  })),
}));

// Mock wouter's useLocation
vi.mock('wouter', () => ({
  ...vi.importActual('wouter'),
  useLocation: () => ['/auth', () => {}],
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}));

describe('AuthPage', () => {
  it('should render the login form by default', () => {
    render(<AuthPage />);
    
    // Check if login form elements exist
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('should switch to the register form when clicking "Sign up"', async () => {
    render(<AuthPage />);
    
    // Click the "Sign up" button
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    // Check if registration form elements exist
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });
  });

  it('should switch back to login form when clicking "Sign in"', async () => {
    render(<AuthPage />);
    
    // First switch to register form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    // Then switch back to login form
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });
    
    // Check if login form elements exist again
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });
  });

  it('should submit the login form with correct values', async () => {
    const mockLoginMutate = vi.fn();
    
    vi.mocked(require('@/hooks/use-auth').useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      loginMutation: {
        isPending: false,
        mutate: mockLoginMutate,
        error: null,
      },
      registerMutation: {
        isPending: false,
        mutate: vi.fn(),
        error: null,
      }
    });
    
    render(<AuthPage />);
    
    // Fill in the login form
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password123!' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if the login mutation was called with correct values
    await waitFor(() => {
      expect(mockLoginMutate).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'Password123!'
      });
    });
  });

  it('should submit the register form with correct values', async () => {
    const mockRegisterMutate = vi.fn();
    
    vi.mocked(require('@/hooks/use-auth').useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      loginMutation: {
        isPending: false,
        mutate: vi.fn(),
        error: null,
      },
      registerMutation: {
        isPending: false,
        mutate: mockRegisterMutate,
        error: null,
      }
    });
    
    render(<AuthPage />);
    
    // Switch to register form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    // Fill in the register form
    await waitFor(() => {
      fireEvent.change(screen.getByPlaceholderText('Username'), {
        target: { value: mockRegisterUser.username }
      });
      
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: mockRegisterUser.password }
      });
      
      fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
        target: { value: mockRegisterUser.confirmPassword }
      });
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    // Check if the register mutation was called with correct values
    await waitFor(() => {
      expect(mockRegisterMutate).toHaveBeenCalledWith({
        username: mockRegisterUser.username,
        password: mockRegisterUser.password
      });
    });
  });

  it('should display error messages for login validation', async () => {
    render(<AuthPage />);
    
    // Submit the form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if validation error messages are displayed
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should display error messages for register validation', async () => {
    render(<AuthPage />);
    
    // Switch to register form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    // Submit the form without filling in any fields
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    });
    
    // Check if validation error messages are displayed
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
    });
  });

  it('should redirect to home page if user is already logged in', () => {
    // Mock the useAuth hook to return a logged in user
    vi.mocked(require('@/hooks/use-auth').useAuth).mockReturnValue({
      user: { id: 1, username: 'testuser' },
      isLoading: false,
      loginMutation: {
        isPending: false,
        mutate: vi.fn(),
        error: null,
      },
      registerMutation: {
        isPending: false,
        mutate: vi.fn(),
        error: null,
      }
    });
    
    // Mock the useLocation hook to allow checking for redirects
    const mockNavigate = vi.fn();
    vi.mock('wouter', () => ({
      ...vi.importActual('wouter'),
      useLocation: () => ['/auth', mockNavigate],
    }));
    
    render(<AuthPage />);
    
    // Check if it tried to navigate to home page
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});