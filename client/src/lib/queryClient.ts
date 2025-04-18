import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { debug, createDebugger } from "./debug";

// Create a specialized debugger for API related debugging
const debugApi = createDebugger('api');

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  debugApi('Request', { method, url, data });
  
  try {
    const startTime = performance.now();
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    const endTime = performance.now();
    
    debugApi('Response', { 
      url, 
      status: res.status, 
      statusText: res.statusText,
      time: `${(endTime - startTime).toFixed(2)}ms`
    });
    
    if (!res.ok) {
      const text = await res.text();
      debugApi('Error response', { status: res.status, text });
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }
    
    return res;
  } catch (error) {
    debugApi('Request failed', { url, error });
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    debugApi('Query request', { url, queryKey });
    
    try {
      const startTime = performance.now();
      const res = await fetch(url, {
        credentials: "include",
      });
      const endTime = performance.now();
      
      debugApi('Query response', { 
        url, 
        status: res.status, 
        statusText: res.statusText,
        time: `${(endTime - startTime).toFixed(2)}ms`
      });
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        debugApi('Query unauthorized (401)', { url });
        return null;
      }
      
      if (!res.ok) {
        const text = await res.text();
        debugApi('Query error response', { status: res.status, text });
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      
      const data = await res.json();
      debugApi('Query data received', { url, dataSize: JSON.stringify(data).length });
      return data;
    } catch (error) {
      debugApi('Query request failed', { url, error });
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
