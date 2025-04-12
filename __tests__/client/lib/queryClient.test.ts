import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, getQueryFn, queryClient } from '@/lib/queryClient';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

// Start server before all tests
beforeEach(() => server.listen());

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  queryClient.clear();
});

describe('queryClient utilities', () => {
  describe('apiRequest', () => {
    it('should make a GET request', async () => {
      // Mock a successful response
      server.use(
        http.get('/api/test-endpoint', () => {
          return HttpResponse.json({ success: true });
        })
      );
      
      const fetchSpy = vi.spyOn(global, 'fetch');
      
      await apiRequest('GET', '/api/test-endpoint');
      
      expect(fetchSpy).toHaveBeenCalledWith('/api/test-endpoint', expect.any(Object));
      
      // Verify the method, but don't strictly check headers as they may vary
      const callArgs = fetchSpy.mock.calls[0][1];
      expect(callArgs.method).toBe('GET');
    });

    it('should make a POST request with body', async () => {
      // Mock a successful response
      server.use(
        http.post('/api/test-post', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json(body);
        })
      );
      
      const fetchSpy = vi.spyOn(global, 'fetch');
      const body = { username: 'testuser', password: 'password' };
      
      await apiRequest('POST', '/api/test-post', body);
      
      expect(fetchSpy).toHaveBeenCalledWith('/api/test-post', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(body),
      }));
    });

    it('should throw an error if the response is not ok', async () => {
      // Mock fetch to return a 400 response
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid request' }),
        text: async () => 'Invalid request',
      } as Response);
      
      await expect(apiRequest('GET', '/api/user')).rejects.toThrow();
    });
  });

  describe('getQueryFn', () => {
    it('should return a function that makes a request to the specified endpoint', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, username: 'testuser' }),
      } as Response);
      
      const queryFn = getQueryFn({ on401: 'throw' });
      await queryFn({ queryKey: ['/api/user'] });
      
      expect(fetchSpy).toHaveBeenCalledWith('/api/user', expect.any(Object));
    });

    it('should handle 401 responses according to on401 option (throw)', async () => {
      // Mock fetch to return a 401 response
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);
      
      const queryFn = getQueryFn({ on401: 'throw' });
      
      await expect(queryFn({ queryKey: ['/api/user'] })).rejects.toThrow();
    });

    it('should handle 401 responses according to on401 option (returnNull)', async () => {
      // Mock fetch to return a 401 response
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);
      
      const queryFn = getQueryFn({ on401: 'returnNull' });
      
      const result = await queryFn({ queryKey: ['/api/user'] });
      expect(result).toBeNull();
    });
  });

  describe('queryClient', () => {
    it('should be an instance of QueryClient', () => {
      expect(queryClient).toBeDefined();
      expect(queryClient.getDefaultOptions()).toBeDefined();
    });
  });
});