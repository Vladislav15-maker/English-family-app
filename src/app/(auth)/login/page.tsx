"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Leaf, LogIn } from 'lucide-react';
import type { LoginCredentials } from '@/types';
// RadioGroup и UserPlus больше не нужны, так как регистрация убрана
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


export default function LoginPage() {
  // isSignUp и связанные с ним состояния удалены
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, isLoading } = useAuth(); // signUp удален из зависимостей
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Логика для SignUp удалена
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
            Welcome! Please login to continue.
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
            
            {/* Поля для SignUp (name, username, role) удалены */}

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="text-base"
              />
            </div>
            
            <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
              {isLoading ? 'Logging In...' : 'Login'}
              <LogIn className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm text-muted-foreground">
           {/* Кнопка для переключения на Sign Up удалена */}
          <p className="mt-2 text-center">
            Enter your credentials to continue.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
