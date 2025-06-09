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


export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, isLoading } = useAuth();
  const router = useRouter(); // Keep router for potential future use, though AuthContext handles redirection
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: "Вход не удался",
        description: "Пожалуйста, введите логин и пароль.",
        variant: "destructive",
      });
      return;
    }
    const credentials: LoginCredentials = { username, password };
    const { success, error } = await login(credentials); // AuthContext login now uses mock data
    
    if (success) {
      // AuthProvider handles redirection
      toast({
        title: "Вход выполнен успешно!",
        description: `Добро пожаловать, ${username}!`,
      });
    } else {
      toast({
        title: "Вход не удался",
        description: error?.message || "Неверный логин или пароль.",
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
            Добро пожаловать! Пожалуйста, войдите, чтобы продолжить.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ваш_логин"
                required
                className="text-base"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password">Пароль</Label>
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
              {isLoading ? 'Вход...' : 'Войти'}
              <LogIn className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </CardContent>
        {/* Removed Sign Up link as per previous user request to disable it */}
        <CardFooter className="flex flex-col items-center text-sm text-muted-foreground">
           <p className="mt-2 text-center">
            Введите свои учетные данные для продолжения.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
