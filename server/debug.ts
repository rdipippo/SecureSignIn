/**
 * Debug utility for server-side debugging
 * 
 * Usage:
 * import { debug } from './debug';
 * 
 * debug('auth', 'User login attempt', { username });
 * debug('db', 'Query executed', { query, params });
 */

// Set this to true to enable debugging
const DEBUG_ENABLED = true;

// Define which modules to debug (empty array means debug all)
const DEBUG_MODULES: string[] = [];

/**
 * Debug function for server-side debugging
 * @param module The module name 
 * @param message The debug message
 * @param data Optional data to log
 */
export function debug(module: string, message: string, data?: any): void {
  if (!DEBUG_ENABLED) return;
  
  // If DEBUG_MODULES is empty, debug all modules
  // Otherwise, only debug modules in the list
  if (DEBUG_MODULES.length > 0 && !DEBUG_MODULES.includes(module)) return;
  
  const timestamp = new Date().toISOString();
  
  console.log(`[DEBUG][${timestamp}][${module}] ${message}`);
  
  if (data) {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
  
  console.log('------------------------------');
}