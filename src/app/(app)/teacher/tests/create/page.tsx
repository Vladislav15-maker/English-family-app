"use client";

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';

export default function CreateTestPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Info className="mr-3 h-7 w-7 text-primary" /> Online Test Creation Disabled
          </CardTitle>
          <CardDescription>
            The functionality to create online unit tests has been replaced with an offline testing process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <p className="text-muted-foreground">
            Unit tests are now conducted offline. Teachers can manually enter student scores for these tests
            by navigating to the student's progress page for a specific unit.
           </p>
            <Button onClick={() => router.push('/teacher/students')}>
                Go to Student List to Enter Scores
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
