"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';

export default function TestWaitingRoomPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately as this page is no longer used for online tests
    router.replace('/student/dashboard'); 
  }, [router]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Info className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Waiting Room Unavailable</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Online test waiting rooms are no longer used. Redirecting...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <p className="text-center text-muted-foreground">
                Unit tests are conducted offline. Your teacher will provide your score.
           </p>
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


    
