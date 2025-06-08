"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from "@/components/ui/skeleton"; // Keep skeleton for loading state

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === 'teacher') {
          router.replace('/teacher/dashboard');
        } else {
          router.replace('/student/dashboard');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-64 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
    );
  }

  // This content will briefly show if redirection is slow or if conditions are somehow not met
  return (
     <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <h1 className="text-2xl font-bold text-foreground">EnglishFamily App</h1>
      <p className="mt-4 text-muted-foreground">
        Redirecting based on your authentication status...
      </p>
    </div>
  );
}
