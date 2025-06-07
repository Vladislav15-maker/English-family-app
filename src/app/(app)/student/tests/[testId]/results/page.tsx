
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mockUnitTests } from '@/lib/mock-data';
import { getStudentProgressForUnit } from '@/lib/progress-utils';
import type { UnitTest as UnitTestType, StudentRoundProgress } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, ListChecks, Percent, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';


export default function StudentTestResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { studentData } = useAuth();
  const testId = params.testId as string;

  const testDetails = mockUnitTests.find(t => t.id === testId);
  
  let studentTestProgress: StudentRoundProgress | undefined = undefined;
  if (studentData && testDetails) {
    const unitProgress = getStudentProgressForUnit(studentData.id, testDetails.unitId);
    if (unitProgress?.unitTest?.roundId === testId) {
      studentTestProgress = unitProgress.unitTest;
    }
  }

  if (!studentData) {
    return <div className="text-center p-8">Loading student data...</div>;
  }
  if (!testDetails) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 text-center">
        <h1 className="text-2xl font-headline text-destructive mb-4">Test Not Found</h1>
        <p className="text-muted-foreground mb-6">The test you are looking for could not be found.</p>
        <Button variant="outline" onClick={() => router.push('/student/tests')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Tests
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
                 <CheckCircle className="h-16 w-16 text-primary" />
            ) : studentTestProgress?.score ? (
                 <Percent className="h-16 w-16 text-orange-500" />
            ) : (
                 <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle className="text-3xl font-headline">{testDetails.title} - Results</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Your performance for this test.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {studentTestProgress && studentTestProgress.completed ? (
            <>
              <div className="text-center">
                <p className="text-5xl font-bold text-primary mb-2">{studentTestProgress.score.toFixed(0)}%</p>
                <Progress value={studentTestProgress.score} className="w-3/4 mx-auto h-3 mb-4" />
                <p className="text-muted-foreground">
                  You answered {studentTestProgress.correctAnswers} out of {studentTestProgress.totalQuestions} questions correctly.
                </p>
                {studentTestProgress.attempts.length > 0 && studentTestProgress.attempts[0].timestamp && (
                     <p className="text-sm text-muted-foreground mt-1">Test taken on: {format(new Date(studentTestProgress.attempts[0].timestamp), "PPpp")}</p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2 text-center">Detailed Breakdown (Coming Soon)</h3>
                <p className="text-muted-foreground text-center">
                  A question-by-question review of your answers will be available here in a future update.
                </p>
                 {/* 
                <ul className="space-y-2">
                  {studentTestProgress.attempts[0].answers.map((ans, idx) => (
                    <li key={idx} className={`p-2 border rounded-md ${ans.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      Question {idx+1}: Your answer "{ans.studentAnswer}" was {ans.isCorrect ? 'Correct' : 'Incorrect'}.
                    </li>
                  ))}
                </ul>
                */}
              </div>
            </>
          ) : (
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <ListChecks className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
              <p className="text-foreground font-medium">Results Not Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                You have not completed this test yet, or the results are still being processed.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => router.push('/student/tests')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Tests
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
