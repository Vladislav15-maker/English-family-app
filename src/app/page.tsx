"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <Skeleton className="w-48 h-12 mb-4 rounded-md" />
      <Skeleton className="w-64 h-8 rounded-md" />
      <p className="mt-4 text-foreground">Loading EnglishFamily...</p>
    </div>
  );
}
