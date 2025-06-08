"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Leaf, UserPlus, LogIn } from 'lucide-react';
import type { LoginCredentials, SignUpCredentials } from '@/types';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign up specific fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState(''); // This is the app-specific username for profile
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  const { login, signUp, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp) {
      if (!email || !password || !name || !username) {
        toast({
          title: "Sign Up Failed",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      const credentials: SignUpCredentials = { email, password, name, username, role };
      const { success, error } = await signUp(credentials);
      if (success) {
         toast({
          title: "Sign Up Successful!",
          description: error?.message || "Please check your email to confirm your account if required.",
        });
        // AuthProvider will redirect on successful auth state change
        // If email confirmation is required, user won't be logged in immediately.
      } else {
        toast({
          title: "Sign Up Failed",
          description: error?.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } else { // Login
      if (!email || !password) {
        toast({
          title: "Login Failed",
          description: "Please enter both email and password.",
          variant: "destructive",
        });
        return;
      }
      const credentials: LoginCredentials = { email, password };
      const { success, error } = await login(credentials);
      if (success) {
        // AuthProvider handles redirection
      } else {
        toast({
          title: "Login Failed",
          description: error?.message || "Invalid email or password.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Leaf className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">EnglishFamily</CardTitle>
          <CardDescription>
            {isSignUp ? "Create your account to start learning." : "Welcome back! Please login."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="text-base"
              />
            </div>
            
            {isSignUp && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Vladislav Yermilov"
                    required
                    className="text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username (for display)</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., VladYermilov"
                    required
                    className="text-base"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={isSignUp ? 6 : undefined} // Supabase default min password length is 6
                className="text-base"
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label>Role</Label>
                <RadioGroup defaultValue="student" value={role} onValueChange={(value) => setRole(value as 'student' | 'teacher')} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="role-student" />
                    <Label htmlFor="role-student">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="teacher" id="role-teacher" />
                    <Label htmlFor="role-teacher">Teacher</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
              {isLoading ? (isSignUp ? 'Signing Up...' : 'Logging In...') : (isSignUp ? 'Sign Up' : 'Login')}
              {isSignUp ? <UserPlus className="ml-2 h-5 w-5" /> : <LogIn className="ml-2 h-5 w-5" />}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm text-muted-foreground">
           <Button 
              variant="link" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:text-primary/80"
              type="button"
            >
            {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
          </Button>
          <p className="mt-2 text-center">
            {isSignUp ? "Join our English learning community." : "Enter your credentials to continue."}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
