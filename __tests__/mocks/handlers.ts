import { http, HttpResponse } from 'msw';
import { mockUsers, mockInsertUser, mockLoginUser, mockInvalidLoginUser } from './data';

// Track authentication status
let isAuthenticated = false;

export const handlers = [
  // GET /api/user - Return user if authenticated
  http.get('/api/user', () => {
    if (isAuthenticated) {
      return HttpResponse.json(mockUsers[0], { status: 200 });
    }
    
    return new HttpResponse(null, { status: 401 });
  }),
  
  // POST /api/login - Authenticate a user
  http.post('/api/login', async ({ request }) => {
    const data = await request.json();
    const { username, password } = data as any;
    
    // Check if the credentials match a mock user
    const user = mockUsers.find(u => u.username === username);
    
    if (user) {
      // Set mock authenticated state
      isAuthenticated = true;
      
      return HttpResponse.json(user, { status: 200 });
    }
    
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),
  
  // POST /api/register - Register a new user
  http.post('/api/register', async ({ request }) => {
    const data = await request.json();
    const { username } = data as any;
    
    // Check if username already exists
    const existingUser = mockUsers.find(u => u.username === username);
    
    if (existingUser) {
      return HttpResponse.text('Username already exists', { status: 400 });
    }
    
    // Create a new user
    const newUser = {
      ...mockInsertUser,
      id: mockUsers.length + 1,
      username,
    };
    
    // Set mock authenticated state
    isAuthenticated = true;
    
    return HttpResponse.json(newUser, { status: 201 });
  }),
  
  // POST /api/logout - Log out a user
  http.post('/api/logout', () => {
    // Clear mock authenticated state
    isAuthenticated = false;
    
    return new HttpResponse(null, { status: 200 });
  }),
];