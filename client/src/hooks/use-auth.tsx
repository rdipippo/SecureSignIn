import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { 
  insertUserSchema, 
  User as SelectUser, 
  InsertUser, 
  LoginUser
} from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { debug, createDebugger } from "@/lib/debug";

const debugAuth = createDebugger('auth');

// Define a user type without password for safer client-side use
type SafeUser = Omit<SelectUser, "password">;

type AuthContextType = {
  user: SafeUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SafeUser, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SafeUser, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SafeUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      debugAuth('Login attempt', { username: credentials.username });
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        const data = await res.json();
        debugAuth('Login API response', { status: res.status, data });
        return data;
      } catch (error) {
        debugAuth('Login API error', { error });
        throw error;
      }
    },
    onSuccess: (user) => {
      debugAuth('Login successful', { userId: user.id, username: user.username });
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: Error) => {
      debugAuth('Login failed', { error });
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      debugAuth('Registration attempt', { username: userData.username, email: userData.email });
      try {
        const res = await apiRequest("POST", "/api/register", userData);
        const data = await res.json();
        debugAuth('Registration API response', { status: res.status, data });
        return data;
      } catch (error) {
        debugAuth('Registration API error', { error });
        throw error;
      }
    },
    onSuccess: (user) => {
      debugAuth('Registration successful', { userId: user.id, username: user.username });
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Success",
        description: "Registration successful",
      });
    },
    onError: (error: Error) => {
      debugAuth('Registration failed', { error });
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      debugAuth('Logout attempt');
      try {
        const res = await apiRequest("POST", "/api/logout");
        debugAuth('Logout API response', { status: res.status });
      } catch (error) {
        debugAuth('Logout API error', { error });
        throw error;
      }
    },
    onSuccess: () => {
      debugAuth('Logout successful');
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      debugAuth('Logout failed', { error });
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
