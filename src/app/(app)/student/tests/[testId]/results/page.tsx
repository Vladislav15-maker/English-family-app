"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUnitById } from '@/lib/course-data'; // Use this to get unit details
import { getStudentProgressForUnit } from '@/lib/progress-utils';
import type { StudentRoundProgress } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Percent, XCircle, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

export default function StudentTestResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { studentData } = useAuth();
  const unitIdFromParams = params.testId as string; // Assuming testId route param is now unitId

  const unitDetails = getUnitById(unitIdFromParams);
  
  let studentTestProgress: StudentRoundProgress | undefined = undefined;
  if (studentData && unitDetails) {
    const unitProgress = getStudentProgressForUnit(studentData.id, unitDetails.id);
    // The score for the "offline" test is stored in unitProgress.unitTest
    if (unitProgress?.unitTest?.completed) {
      studentTestProgress = unitProgress.unitTest;
    }
  }

  if (!studentData) {
    return <div className="text-center p-8">Loading student data...</div>;
  }
  if (!unitDetails) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 text-center">
        <h1 className="text-2xl font-headline text-destructive mb-4">Unit Not Found</h1>
        <p className="text-muted-foreground mb-6">Details for this unit could not be found.</p>
        <Button variant="outline" onClick={() => router.push('/student/tests')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Test Scores
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {studentTestProgress?.score && studentTestProgress.score >= 80 ? (
                 <Award className="h-16 w-16 text-primary" />
            ) : studentTestProgress?.score ? (
                 <Percent className="h-16 w-16 text-orange-500" />
            ) : (
                 <XCircle className="h-16 w-16 text-destructive" /> // Should not happen if page is for viewing scores
            )}
          </div>
          <CardTitle className="text-3xl font-headline">{unitDetails.title} - Test Score</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Your manually entered score for this unit's offline test.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {studentTestProgress && studentTestProgress.completed ? (
            <>
              <div className="text-center">
                <p className="text-5xl font-bold text-primary mb-2">{studentTestProgress.score.toFixed(0)}%</p>
                <Progress value={studentTestProgress.score} className="w-3/4 mx-auto h-3 mb-4" />
                <p className="text-muted-foreground">
                  This score was entered by your teacher.
                </p>
                {studentTestProgress.attempts.length > 0 && studentTestProgress.attempts[0].timestamp && (
                     <p className="text-sm text-muted-foreground mt-1">Date Graded: {format(new Date(studentTestProgress.attempts[0].timestamp), "PPpp")}</p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2 text-center">Test Details</h3>
                <p className="text-muted-foreground text-center">
                  This unit test was conducted offline by your teacher. Detailed question breakdown is not available here.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <Award className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
              <p className="text-foreground font-medium">Score Not Yet Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your teacher has not yet entered a score for this unit's test.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => router.push('/student/tests')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Test Scores
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
