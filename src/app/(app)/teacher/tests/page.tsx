"use client";

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, Edit } from 'lucide-react'; // Changed icons

export default function TeacherTestsPage() {
  const { teacherData } = useAuth();

  if (!teacherData) {
    return <div className="text-center p-8">Loading teacher data...</div>;
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
              <BookText className="h-8 w-8 text-primary" />
              <div>
                  <h1 className="text-3xl font-headline text-foreground">Unit Test Information</h1>
                  <p className="text-muted-foreground">Unit tests are conducted offline.</p>
              </div>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Offline Unit Tests</CardTitle>
            <CardDescription>
              All unit tests for this course are administered offline (e.g., on paper or verbally).
              Scores for these tests should be entered manually for each student.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-foreground">
              To enter or update a student's score for a unit test:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Navigate to the "Students" section from the sidebar.</li>
              <li>Select the student whose score you want to enter/update.</li>
              <li>On the student's detail page, choose the relevant unit.</li>
              <li>On the student's unit progress page, you will find a section to enter the "Unit Test (Offline)" score.</li>
            </ol>
            <div className="mt-6 flex justify-start">
                <Link href="/teacher/students" passHref>
                    <Button variant="default">
                        <Edit className="mr-2 h-4 w-4" /> Go to Student List to Enter Scores
                    </Button>
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
