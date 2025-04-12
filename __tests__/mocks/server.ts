import { setupServer } from 'msw/node';
import { handlers } from './handlers';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Set up a mock server using the specified handlers
export const server = setupServer(...handlers);

// Start the server before all tests
beforeAll(() => server.listen());

// Reset any handlers that may have been added during tests between each test
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());