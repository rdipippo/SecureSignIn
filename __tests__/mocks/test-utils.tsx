import { cleanup, render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach } from 'vitest';
import { AuthProvider } from '@/hooks/use-auth';
import React, { ReactElement } from 'react';

// Create a fresh query client for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Create a custom render function that wraps the component with necessary providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const testQueryClient = createTestQueryClient();
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  
  return render(ui, { wrapper: Wrapper, ...options });
};

// Clean up after each test
afterEach(() => {
  cleanup();
});

export * from '@testing-library/react';
export { customRender as render };