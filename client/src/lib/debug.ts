/**
 * Debug utility for client-side debugging
 * 
 * Usage:
 * import { debug } from '@/lib/debug';
 * 
 * debug('auth', 'User login attempt', { username });
 * debug('api', 'API request failed', { error });
 */

// Set to true to enable debug logging in the browser console
const DEBUG_ENABLED = true;

// Define which modules to debug (empty array means debug all)
const DEBUG_MODULES: string[] = [];

// Define the colors for different log types
const LOG_COLORS = {
  info: '#2563eb',    // blue
  error: '#dc2626',   // red
  warn: '#f59e0b',    // amber
  success: '#16a34a', // green
  auth: '#8b5cf6',    // violet
  api: '#ec4899',     // pink
};

type LogType = keyof typeof LOG_COLORS;

/**
 * Log a debug message to the console
 * @param module The module name or log type
 * @param message The debug message
 * @param data Optional data to log
 */
export function debug(module: string, message: string, data?: any): void {
  if (!DEBUG_ENABLED) return;
  
  // If DEBUG_MODULES is empty, debug all modules
  // Otherwise, only debug modules in the list
  if (DEBUG_MODULES.length > 0 && !DEBUG_MODULES.includes(module)) return;
  
  const color = LOG_COLORS[module as LogType] || '#6b7280'; // gray if not defined
  
  console.group(`%c[${module.toUpperCase()}]`, `color: ${color}; font-weight: bold;`);
  console.log(`%c${message}`, 'color: #374151;'); // gray-700
  
  if (data) {
    console.log('Data:', data);
  }
  
  console.groupEnd();
}

/**
 * Create a specific debug logger for a module
 * @param module The module name
 * @returns A debug function that automatically uses the specified module
 */
export function createDebugger(module: string) {
  return (message: string, data?: any) => debug(module, message, data);
}