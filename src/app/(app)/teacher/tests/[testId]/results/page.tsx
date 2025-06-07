
"use client";

import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChartHorizontalBig } from 'lucide-react';
import { mockUnitTests } from '@/lib/mock-data';

export default function TestResultsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  const test = mockUnitTests.find(t => t.id === testId);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.push('/teacher/tests')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Test List
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <BarChartHorizontalBig className="mr-3 h-7 w-7 text-primary" /> Test Results: {test?.title || "Test Not Found"}
          </CardTitle>
          <CardDescription>
            This page will display student submissions and results for this test. This functionality is currently under construction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {test ? (
            <p className="text-muted-foreground">
              Viewing results for "{test.title}" will be available soon.
            </p>
          ) : (
            <p className="text-destructive">The selected test could not be found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
