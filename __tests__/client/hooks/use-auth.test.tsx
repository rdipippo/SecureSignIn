import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, waitFor } from '../../mocks/test-utils';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { mockUsers, mockInsertUser, mockLoginUser } from '../../mocks/data';
import React from 'react';

// Mock the queryClient module
vi.mock('@/lib/queryClient', () => {
  const mockSetQueryData = vi.fn();
  return {
    getQueryFn: vi.fn(() => vi.fn()),
    apiRequest: vi.fn(),
    queryClient: {
      setQueryData: mockSetQueryData,
    },
  };
});

// Create a test wrapper component
const TestComponent = () => {
  const { user, isLoading, loginMutation, logoutMutation, registerMutation } = useAuth();
  
  return (
    <div>
      <div data-testid="user-data">{user ? JSON.stringify(user) : 'no user'}</div>
      <div data-testid="loading-status">{isLoading ? 'loading' : 'not loading'}</div>
      <button 
        data-testid="login-button" 
        onClick={() => loginMutation.mutate(mockLoginUser)}
      >
        Login
      </button>
      <button 
        data-testid="register-button" 
        onClick={() => registerMutation.mutate(mockInsertUser)}
      >
        Register
      </button>
      <button 
        data-testid="logout-button" 
        onClick={() => logoutMutation.mutate()}
      >
        Logout
      </button>
    </div>
  );
};

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide user data from query result', async () => {
    // Setup successful query response
    const { getQueryFn, queryClient } = await import('@/lib/queryClient');
    
    vi.mocked(getQueryFn).mockReturnValue(() => Promise.resolve(mockUsers[0]));
    
    // Render with hook
    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for the query to resolve
    await waitFor(() => {
      expect(screen.getByTestId('loading-status').textContent).toBe('not loading');
    });
    
    // Check if user data is available
    expect(screen.getByTestId('user-data').textContent).toContain(mockUsers[0].username);
  });

  it('should handle login mutation', async () => {
    // Setup successful query response
    const { apiRequest, queryClient } = await import('@/lib/queryClient');
    
    vi.mocked(apiRequest).mockResolvedValue({
      json: async () => mockUsers[0],
    } as Response);
    
    // Render with hook
    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click login button
    screen.getByTestId('login-button').click();
    
    // Check if apiRequest was called correctly
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/login', mockLoginUser);
    });
    
    // Check if queryClient.setQueryData was called to update user data
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['/api/user'], mockUsers[0]);
  });

  it('should handle register mutation', async () => {
    // Setup successful query response
    const { apiRequest, queryClient } = await import('@/lib/queryClient');
    
    vi.mocked(apiRequest).mockResolvedValue({
      json: async () => mockUsers[0],
    } as Response);
    
    // Render with hook
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click register button
    screen.getByTestId('register-button').click();
    
    // Check if apiRequest was called correctly
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/register', mockInsertUser);
    });
    
    // Check if queryClient.setQueryData was called to update user data
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['/api/user'], mockUsers[0]);
  });

  it('should handle logout mutation', async () => {
    // Setup successful query response
    const { apiRequest, queryClient } = await import('@/lib/queryClient');
    
    vi.mocked(apiRequest).mockResolvedValue({} as Response);
    
    // Render with hook
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click logout button
    screen.getByTestId('logout-button').click();
    
    // Check if apiRequest was called correctly
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/logout');
    });
    
    // Check if queryClient.setQueryData was called to clear user data
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['/api/user'], null);
  });

  it('should handle login error', async () => {
    // Setup error response
    const { apiRequest } = await import('@/lib/queryClient');
    
    vi.mocked(apiRequest).mockRejectedValue(new Error('Invalid credentials'));
    
    // Spy on toast
    const mockToast = vi.fn();
    vi.mock('@/hooks/use-toast', () => ({
      useToast: () => ({
        toast: mockToast,
      }),
    }));
    
    // Render with hook
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click login button
    screen.getByTestId('login-button').click();
    
    // Check if toast was called with error message
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Login failed',
        description: 'Invalid credentials',
        variant: 'destructive',
      }));
    });
  });
});