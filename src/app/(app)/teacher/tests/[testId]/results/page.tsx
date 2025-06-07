"use client";

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';

export default function TestResultsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.push('/teacher/tests')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Test Info
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Info className="mr-3 h-7 w-7 text-primary" /> Test Results Page Disabled
          </CardTitle>
          <CardDescription>
            This page is no longer used. Student test scores are viewed and managed on their individual progress pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
              To view or enter scores, please navigate to the specific student and unit.
            </p>
            <Button onClick={() => router.push('/teacher/students')} className="mt-4">
                Go to Student List
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}