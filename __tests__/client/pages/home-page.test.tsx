import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../mocks/test-utils';
import HomePage from '@/pages/home-page';
import { mockUsers } from '../../mocks/data';

// Mock the useAuth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: mockUsers[0].id, username: mockUsers[0].username },
    isLoading: false,
    logoutMutation: {
      isPending: false,
      mutate: vi.fn(),
    },
  })),
}));

// Mock wouter for navigation
vi.mock('wouter', () => ({
  ...vi.importActual('wouter'),
  Link: ({ children, to }: { children: React.ReactNode, to: string }) => (
    <a href={to} data-testid="nav-link">{children}</a>
  ),
}));

describe('HomePage', () => {
  it('should render the welcome message with username', () => {
    render(<HomePage />);
    
    expect(screen.getByText(new RegExp(`welcome.*${mockUsers[0].username}`, 'i'))).toBeInTheDocument();
  });

  it('should render a logout button', () => {
    render(<HomePage />);
    
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('should call logout mutation when clicking the logout button', () => {
    const mockLogoutMutate = vi.fn();
    
    vi.mocked(require('@/hooks/use-auth').useAuth).mockReturnValue({
      user: { id: mockUsers[0].id, username: mockUsers[0].username },
      isLoading: false,
      logoutMutation: {
        isPending: false,
        mutate: mockLogoutMutate,
      },
    });
    
    render(<HomePage />);
    
    // Click the logout button
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    logoutButton.click();
    
    // Check if the logout mutation was called
    expect(mockLogoutMutate).toHaveBeenCalled();
  });

  it('should display a loading state when logout is pending', () => {
    vi.mocked(require('@/hooks/use-auth').useAuth).mockReturnValue({
      user: { id: mockUsers[0].id, username: mockUsers[0].username },
      isLoading: false,
      logoutMutation: {
        isPending: true,
        mutate: vi.fn(),
      },
    });
    
    render(<HomePage />);
    
    // Check if the logout button shows loading state
    const logoutButton = screen.getByRole('button', { name: /logging out.../i });
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toBeDisabled();
  });
});