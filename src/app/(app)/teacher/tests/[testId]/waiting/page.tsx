"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';

export default function TeacherTestWaitingRoomPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/teacher/tests'); // Redirect as this page is no longer used
  }, [router]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
             <Info className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Waiting Room Disabled</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Online test waiting rooms are no longer used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
             <p className="text-center text-muted-foreground">
                Unit tests are conducted offline. Scores are entered manually. Redirecting...
             </p>
        </CardContent>
         <CardFooter className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => router.push('/teacher/tests')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Test Info
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
