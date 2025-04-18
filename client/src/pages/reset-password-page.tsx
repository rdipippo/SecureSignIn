import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Schema for password reset
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Schema for requesting password reset
const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ResetPasswordPage() {
  const [location] = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [token, setToken] = useState<string>("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Extract token from query parameters
  useEffect(() => {
    // If user is logged in, redirect to home page
    if (user) {
      navigate("/");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (tokenParam) {
      setToken(tokenParam);
      setShowResetForm(true);
    } else {
      setShowResetForm(false);
    }
  }, [user, navigate]);

  // Form for resetting password
  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Form for requesting password reset
  const requestForm = useForm<z.infer<typeof requestResetSchema>>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });

  // Mutation for resetting password
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resetPasswordSchema>) => {
      const response = await apiRequest("POST", "/api/reset-password", {
        token,
        password: data.password,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. You can now log in with your new password.",
      });
      navigate("/auth");
    },
    onError: (error: Error) => {
      setFormError(error.message);
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for requesting password reset
  const requestResetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof requestResetSchema>) => {
      const response = await apiRequest("POST", "/api/request-password-reset", {
        email: data.email,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Email Sent",
        description: "If your email is registered, you will receive a password reset link shortly.",
      });
      requestForm.reset();
    },
    onError: (error: Error) => {
      setFormError(error.message);
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler for resetting password
  function onSubmitReset(data: z.infer<typeof resetPasswordSchema>) {
    setFormError(null);
    resetPasswordMutation.mutate(data);
  }

  // Handler for requesting password reset
  function onSubmitRequest(data: z.infer<typeof requestResetSchema>) {
    setFormError(null);
    requestResetMutation.mutate(data);
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">
            {showResetForm ? "Reset Your Password" : "Forgot Password"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {showResetForm 
              ? "Enter your new password below." 
              : "Enter your email address and we'll send you a link to reset your password."}
          </p>
        </div>

        {formError && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 dark:text-red-300 rounded-md">
            {formError}
          </div>
        )}

        {showResetForm ? (
          <Form {...resetForm}>
            <form 
              onSubmit={resetForm.handleSubmit(onSubmitReset)} 
              className="space-y-4"
            >
              <FormField
                control={resetForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...requestForm}>
            <form 
              onSubmit={requestForm.handleSubmit(onSubmitRequest)} 
              className="space-y-4"
            >
              <FormField
                control={requestForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="name@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={requestResetMutation.isPending}
              >
                {requestResetMutation.isPending ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>
        )}
        
        <div className="text-center">
          <Button 
            variant="ghost" 
            className="mt-4"
            onClick={() => navigate("/auth")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}