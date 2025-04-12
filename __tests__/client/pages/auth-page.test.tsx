import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../mocks/test-utils';
import AuthPage from '@/pages/auth-page';
import { mockRegisterUser } from '../../mocks/data';
import React from 'react';

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
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock wouter's useLocation
vi.mock('wouter', () => ({
  ...vi.importActual('wouter'),
  useLocation: () => ['/auth', () => {}],
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
  Redirect: ({ to }: { to: string }) => <div data-testid="redirect" data-to={to}>Redirecting...</div>,
}));

// Mock the shadcn Tabs component
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ defaultValue, value, onValueChange, className, children }: any) => (
    <div className={className} data-testid="tabs">
      {React.Children.map(children, (child) => 
        React.cloneElement(child, { onValueChange })
      )}
    </div>
  ),
  TabsList: ({ className, children }: any) => (
    <div className={className} data-testid="tabs-list">
      {children}
    </div>
  ),
  TabsTrigger: ({ value, className, children, onValueChange }: any) => (
    <button 
      role="tab" 
      data-value={value} 
      className={className} 
      data-testid={`tab-${value}`}
      onClick={() => onValueChange && onValueChange(value)}
    >
      {children}
    </button>
  ),
  TabsContent: ({ value, className, children }: any) => (
    <div 
      role="tabpanel" 
      data-value={value} 
      className={className}
      data-testid={`tabpanel-${value}`}
    >
      {children}
    </div>
  ),
}));

// Mock the shadcn Form components
vi.mock('@/components/ui/form', () => {
  // Setup a place to store form errors for testing
  const formErrors: Record<string, string> = {};
  
  return {
    Form: ({ children, ...props }: any) => {
      // Allow tests to trigger form errors via form.formState
      const mockFormContext = {
        ...props,
        formState: {
          errors: {
            username: { message: 'Username is required' },
            password: { message: 'Password is required' },
            confirmPassword: { message: 'Confirm password is required' },
          }
        }
      };
      
      return <div data-testid="form">{
        typeof children === 'function' ? 
          children(mockFormContext) : 
          children
      }</div>;
    },
    FormField: ({ control, name, render }: any) => {
      const fieldState = { invalid: true, error: { message: `${name} is required` } };
      return render({ 
        field: { 
          name, 
          value: '', 
          onChange: () => {},
          ref: () => {},
          onBlur: () => {},
        },
        fieldState
      });
    },
    FormItem: ({ children }: any) => <div data-testid="form-item">{children}</div>,
    FormLabel: ({ children }: any) => <label data-testid="form-label">{children}</label>,
    FormControl: ({ children }: any) => <div data-testid="form-control">{children}</div>,
    FormMessage: () => <div data-testid="form-message">Username is required</div>,
  };
});

// Mock the shadcn Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, type, className, onClick }: any) => (
    <button 
      type={type} 
      className={className} 
      onClick={onClick}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

// Mock the input component
vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} data-testid="input" />,
}));

// Mock the Card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardFooter: ({ children }: any) => <div data-testid="card-footer">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }: any) => <p data-testid="card-description">{children}</p>,
}));

// Mock the Alert components
vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => <div data-testid="alert" data-variant={variant}>{children}</div>,
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>,
}));

// Mock the Checkbox component
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: (props: any) => <input type="checkbox" {...props} data-testid="checkbox" />,
}));

// Mock the Loader2 icon from lucide-react
vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader-icon">Loading...</span>,
}));

describe('AuthPage', () => {
  it('should render the login form by default', () => {
    render(<AuthPage />);
    
    // Check if login form elements exist
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/new here/i)).toBeInTheDocument();
  });

  it('should switch to the register form when clicking "Register"', async () => {
    render(<AuthPage />);
    
    // Click the "Register" tab
    fireEvent.click(screen.getByRole('tab', { name: /register/i }));
    
    // Check if registration form elements exist
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument(); 
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });
  });

  it('should switch back to login form when clicking "Login"', async () => {
    render(<AuthPage />);
    
    // First switch to register form
    fireEvent.click(screen.getByRole('tab', { name: /register/i }));
    
    // Then switch back to login form
    await waitFor(() => {
      fireEvent.click(screen.getByRole('tab', { name: /login/i }));
    });
    
    // Check if login form elements exist again
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByText(/new here/i)).toBeInTheDocument();
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
    
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password123!' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
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
    fireEvent.click(screen.getByRole('tab', { name: /register/i }));
    
    // Fill in the register form
    await waitFor(() => {
      fireEvent.change(screen.getByPlaceholderText('Username'), {
        target: { value: mockRegisterUser.username }
      });
      
      // Find all password fields - there are two of them in register form
      const passwordFields = screen.getAllByPlaceholderText('••••••••');
      
      // First is password
      fireEvent.change(passwordFields[0], {
        target: { value: mockRegisterUser.password }
      });
      
      // Second is confirm password
      fireEvent.change(passwordFields[1], {
        target: { value: mockRegisterUser.confirmPassword }
      });
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
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
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check if validation error messages are displayed
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should display error messages for register validation', async () => {
    render(<AuthPage />);
    
    // Switch to register form
    fireEvent.click(screen.getByRole('tab', { name: /register/i }));
    
    // Submit the form without filling in any fields
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
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