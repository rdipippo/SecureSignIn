import { http, HttpResponse } from 'msw';
import { mockUsers } from './data';

// Create mock handlers for API endpoints
export const handlers = [
  // Get current user
  http.get('/api/user', () => {
    // Return the first user without the password
    const { password, ...user } = mockUsers[0];
    return HttpResponse.json(user);
  }),

  // Login
  http.post('/api/login', async ({ request }) => {
    const data = await request.json();
    
    const user = mockUsers.find(u => u.username === data.username);
    if (!user) {
      return new HttpResponse(null, { status: 401 });
    }
    
    // In a real test, we would verify the password here
    const { password, ...safeUser } = user;
    return HttpResponse.json(safeUser);
  }),

  // Register
  http.post('/api/register', async ({ request }) => {
    const data = await request.json();
    
    // Check if username exists
    const existingUser = mockUsers.find(u => u.username === data.username);
    if (existingUser) {
      return new HttpResponse(JSON.stringify({ message: 'Username already exists' }), {
        status: 400,
      });
    }
    
    // Return a new user
    return HttpResponse.json({
      id: mockUsers.length + 1,
      username: data.username,
    }, { status: 201 });
  }),

  // Logout
  http.post('/api/logout', () => {
    return new HttpResponse(null, { status: 200 });
  }),
];