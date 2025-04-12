import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../mocks/test-utils';
import NotFound from '@/pages/not-found';

// Mock wouter for Link component
vi.mock('wouter', () => ({
  Link: ({ children, to }: { children: React.ReactNode, to: string }) => (
    <a href={to} data-testid="link">{children}</a>
  ),
}));

describe('NotFound Page', () => {
  it('should render the 404 error message', () => {
    render(<NotFound />);
    
    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it('should have a link back to the home page', () => {
    render(<NotFound />);
    
    const homeLink = screen.getByTestId('link');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.getAttribute('href')).toBe('/');
    expect(homeLink.textContent).toMatch(/back to home/i);
  });
});