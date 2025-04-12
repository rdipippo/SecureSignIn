import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth, AuthProvider } from '@/hooks/use-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { mockLoginUser, mockRegisterUser } from '../../mocks/data';
import { server } from '../../mocks/server';

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers between tests
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

// Create a wrapper for the hooks
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

// Mock the toast module
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useAuth Hook', () => {
  it('should initialize with null user and not loading', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should have login, logout and register mutations', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loginMutation).toBeDefined();
    expect(result.current.logoutMutation).toBeDefined();
    expect(result.current.registerMutation).toBeDefined();
  });

  it('should be able to log in a user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.loginMutation.mutate({
        username: mockLoginUser.username,
        password: mockLoginUser.password,
      });
    });

    await waitFor(() => {
      expect(result.current.loginMutation.isPending).toBe(false);
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user?.username).toBe(mockLoginUser.username);
  });

  it('should be able to register a new user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.registerMutation.mutate({
        username: mockRegisterUser.username,
        password: mockRegisterUser.password,
      });
    });

    await waitFor(() => {
      expect(result.current.registerMutation.isPending).toBe(false);
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user?.username).toBe(mockRegisterUser.username);
  });

  it('should be able to log out a user', async () => {
    // First log in
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.loginMutation.mutate({
        username: mockLoginUser.username,
        password: mockLoginUser.password,
      });
    });

    await waitFor(() => {
      expect(result.current.loginMutation.isPending).toBe(false);
    });

    // Then log out
    act(() => {
      result.current.logoutMutation.mutate();
    });

    await waitFor(() => {
      expect(result.current.logoutMutation.isPending).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });
});