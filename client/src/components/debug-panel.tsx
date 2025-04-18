import React, { useState, useEffect } from 'react';
import { X, ArrowDown, ArrowUp, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';

/**
 * Debug Panel Component
 * 
 * A collapsible panel that displays information useful for debugging
 * such as current user state, authentication status, etc.
 */
export function DebugPanel() {
  // Only show debug panel in development mode
  if (process.env.NODE_ENV === 'production') return null;

  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<{time: string, message: string, data?: any}[]>([]);
  const { user, isLoading } = useAuth();

  // Intercept console.log to capture debug messages
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleDebug = console.debug;
    
    // Only capture logs that start with [DEBUG]
    console.log = (...args) => {
      originalConsoleLog(...args);
      
      const firstArg = args[0];
      if (typeof firstArg === 'string' && firstArg.includes('[DEBUG]')) {
        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        setLogs(prevLogs => [
          { time: timeString, message: firstArg, data: args.slice(1) },
          ...prevLogs
        ].slice(0, 100)); // Keep only the last 100 logs
      }
    };
    
    console.debug = (...args) => {
      originalConsoleDebug(...args);
      
      const now = new Date();
      const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      setLogs(prevLogs => [
        { time: timeString, message: args[0], data: args.slice(1) },
        ...prevLogs
      ].slice(0, 100)); // Keep only the last 100 logs
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.debug = originalConsoleDebug;
    };
  }, []);

  // Toggle the debug panel
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  // Clear all logs
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Debug toggle button */}
      <Button 
        onClick={togglePanel} 
        variant="outline" 
        className="flex items-center space-x-1 bg-gray-800 text-white hover:bg-gray-700"
      >
        <Bug size={16} />
        <span>Debug</span>
        {isOpen ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
      </Button>
      
      {/* Debug panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-96 bg-gray-800 text-white rounded-lg shadow-xl overflow-hidden">
          <div className="flex justify-between items-center p-2 bg-gray-900">
            <h3 className="font-semibold">Debug Panel</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
              <X size={14} />
            </Button>
          </div>
          
          <div className="p-3 border-b border-gray-700">
            <h4 className="font-medium mb-1">Auth State</h4>
            <div className="text-xs font-mono bg-gray-900 p-2 rounded">
              <div>Loading: {isLoading ? 'true' : 'false'}</div>
              <div>Authenticated: {user ? 'true' : 'false'}</div>
              {user && (
                <>
                  <div>User ID: {user.id}</div>
                  <div>Username: {user.username}</div>
                  <div>Email: {user.email}</div>
                </>
              )}
            </div>
          </div>
          
          <div className="p-2 border-b border-gray-700 flex justify-between items-center">
            <h4 className="font-medium">Debug Logs</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearLogs} 
              className="h-7 text-xs"
            >
              Clear
            </Button>
          </div>
          
          <ScrollArea className="h-60">
            <div className="p-2 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic p-2 text-center">
                  No logs yet
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-2 pb-2 border-b border-gray-700">
                    <div className="text-gray-400">[{log.time}]</div>
                    <div className="text-green-400">{log.message}</div>
                    {log.data && (
                      <pre className="text-gray-300 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}