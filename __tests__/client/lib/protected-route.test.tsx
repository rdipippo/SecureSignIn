import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../mocks/test-utils';
import { ProtectedRoute } from '@/lib/protected-route';
import { mockUsers } from '../../mocks/data';
import React from 'react';

// Mock the useAuth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isLoading: false,
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the wouter package
vi.mock('wouter', () => ({
  Route: ({ children }: { children: React.ReactNode }) => <div data-testid="route">{children}</div>,
  Redirect: ({ to }: { to: string }) => <div data-testid="redirect" data-to={to}>Redirecting...</div>,
}));

describe('ProtectedRoute', () => {
  const MockComponent = () => <div data-testid="protected-content">Protected Content</div>;

  it('should render a loader when loading', () => {
    // Override the mock
    const useAuth = vi.fn(() => ({
      user: null,
      isLoading: true,
    }));
    vi.doMock('@/hooks/use-auth', () => ({ useAuth }));

    render(<ProtectedRoute path="/protected" component={MockComponent} />);
    
    expect(screen.getByTestId('route')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should redirect to /auth when not authenticated', () => {
    // Override the mock
    const useAuth = vi.fn(() => ({
      user: null,
      isLoading: false,
    }));
    vi.doMock('@/hooks/use-auth', () => ({ useAuth }));

    render(<ProtectedRoute path="/protected" component={MockComponent} />);
    
    expect(screen.getByTestId('redirect')).toBeInTheDocument();
    expect(screen.getByTestId('redirect').getAttribute('data-to')).toBe('/auth');
  });

  it('should render the protected component when authenticated', () => {
    // Override the mock
    const useAuth = vi.fn(() => ({
      user: { id: 1, username: mockUsers[0].username },
      isLoading: false,
    }));
    vi.doMock('@/hooks/use-auth', () => ({ useAuth }));

    const { container } = render(<ProtectedRoute path="/protected" component={MockComponent} />);
    
    // Since we're testing route rendering which might be a bit tricky with the mocked router,
    // we'll just check if our component is anywhere in the rendered output
    expect(container.innerHTML).toContain('Protected Content');
  });
});