import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserCircle } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-primary">AppName</Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                  <span>{user?.username.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.username}</span>
              </Link>
              <Button
                variant="ghost"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <UserCircle className="mx-auto h-20 w-20 text-primary" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Welcome, {user?.username}!</h1>
          <p className="mt-2 text-lg text-gray-600">
            You have successfully logged in to your account.
          </p>
          <div className="mt-8">
            <Button asChild>
              <Link href="/profile">View Profile</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; 2023 AppName. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
