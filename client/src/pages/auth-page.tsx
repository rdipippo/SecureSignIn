import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect, Link } from "wouter";
import { z } from "zod";
import { loginUserSchema, registerUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // If user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side: Form */}
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-md mx-auto lg:w-96">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary">AppName</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account or create a new one to get started.
            </p>
          </div>

          <Tabs 
            defaultValue="login" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm 
                isPending={loginMutation.isPending} 
                onSubmit={(data) => {
                  console.log("Login form submitted", data);
                  loginMutation.mutate(data);
                }}
                error={loginMutation.error?.message} 
                onRegisterClick={() => setActiveTab("register")}
              />
            </TabsContent>
            
            <TabsContent value="register">
              <RegisterForm 
                isPending={registerMutation.isPending} 
                onSubmit={(data) => {
                  const { confirmPassword, ...registerData } = data;
                  registerMutation.mutate(registerData);
                }}
                error={registerMutation.error?.message}
                onLoginClick={() => setActiveTab("login")}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side: Hero image/content */}
      <div className="relative flex-1 hidden w-0 lg:block">
        <div className="absolute inset-0 flex flex-col justify-center p-12 bg-gradient-to-br from-primary/80 to-primary">
          <div className="max-w-xl p-8 mx-auto text-white rounded-lg bg-primary/20 backdrop-blur-sm">
            <h2 className="text-3xl font-bold">Welcome to Our Platform</h2>
            <p className="mt-4 text-lg">
              A secure authentication system with user registration, login, and profile management.
            </p>
            <ul className="mt-6 space-y-2">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Secure user authentication
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Password encryption
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                User profile management
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

type LoginFormProps = {
  isPending: boolean;
  onSubmit: (data: z.infer<typeof loginUserSchema>) => void;
  error?: string;
  onRegisterClick: () => void;
};

function LoginForm({ isPending, onSubmit, error, onRegisterClick }: LoginFormProps) {
  const form = useForm<z.infer<typeof loginUserSchema>>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // This function will get called when form is validated
  const handleFormSubmit = (data: z.infer<typeof loginUserSchema>) => {
    console.log("Login form submitted with valid data:", data);
    try {
      onSubmit(data);
    } catch (err) {
      console.error("Error submitting login form:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login to Your Account</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form 
            onSubmit={(e) => {
              console.log("Form submitted", form.getValues());
              console.log("Form errors:", form.formState.errors);
              e.preventDefault(); // Prevent default form submission
              
              // Manually validate and handle form
              const formData = form.getValues();
              // The loginUserSchema requires email field but our login form doesn't have it
              // So we'll use a simplified schema for login validation
              const loginFormSchema = z.object({
                username: z.string().min(3, "Username must be at least 3 characters"),
                password: z.string().min(8, "Password must be at least 8 characters"),
              });
              
              const validationResult = loginFormSchema.safeParse(formData);
              if (validationResult.success) {
                console.log("Form validation passed, submitting to API");
                // Add email property to match the required LoginUser type
                onSubmit({
                  ...validationResult.data,
                  email: "" // this won't be used for login but satisfies the type
                });
              } else {
                console.error("Form validation failed:", validationResult.error);
              }
            }} 
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Username" 
                      {...field} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      {...field} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              <Link 
                to="/reset-password" 
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="relative w-full my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              New here?
            </span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={onRegisterClick} 
          className="w-full"
          disabled={isPending}
        >
          Create an account
        </Button>
      </CardFooter>
    </Card>
  );
}

type RegisterFormProps = {
  isPending: boolean;
  onSubmit: (data: z.infer<typeof registerUserSchema>) => void;
  error?: string;
  onLoginClick: () => void;
};

function RegisterForm({ isPending, onSubmit, error, onLoginClick }: RegisterFormProps) {
  const form = useForm<z.infer<typeof registerUserSchema>>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // This function will get called when form is validated
  const handleFormSubmit = (data: z.infer<typeof registerUserSchema>) => {
    console.log("Register form submitted with valid data:", data);
    try {
      onSubmit(data);
    } catch (err) {
      console.error("Error submitting register form:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Account</CardTitle>
        <CardDescription>Register to get started with our platform</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form 
            onSubmit={(e) => {
              console.log("Register form submitted");
              form.handleSubmit(handleFormSubmit)(e);
            }} 
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Username" 
                      {...field} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="you@example.com" 
                      {...field} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      {...field} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      {...field} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" required />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="relative w-full my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Already have an account?
            </span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={onLoginClick} 
          className="w-full"
          disabled={isPending}
        >
          Log in
        </Button>
      </CardFooter>
    </Card>
  );
}
