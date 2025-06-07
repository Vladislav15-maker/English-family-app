"use client";

import { useAuth } from '@/context/AuthContext';
import { getUnitById, courseUnits } from '@/lib/course-data'; // Added courseUnits
import { getStudentProgressForUnit } from '@/lib/progress-utils';
import type { StudentRoundProgress } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { GraduationCap, ArrowLeft, CheckCircle, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';

export default function StudentTestsPage() {
  const { studentData } = useAuth();
  const router = useRouter();

  if (!studentData) {
    return <div className="text-center p-8">Loading student data...</div>;
  }

  // Get all unit tests progress
  const testScores = courseUnits.map(unit => {
    const unitProgress = getStudentProgressForUnit(studentData.id, unit.id);
    return {
      unitId: unit.id,
      unitTitle: unit.title,
      unitDescription: unit.description,
      testProgress: unitProgress?.unitTest // This is StudentRoundProgress for the test
    };
  }).filter(ts => ts.testProgress && ts.testProgress.completed); // Only show graded tests

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="flex items-center mb-8">
        <GraduationCap className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-headline text-foreground">My Test Scores</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        View scores for your offline unit tests entered by your teacher.
      </p>

      {testScores.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">No test scores available at the moment.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testScores.map(({ unitId, unitTitle, unitDescription, testProgress }) => {
          if (!testProgress) return null; // Should be filtered out, but good practice

          const score = testProgress.score;
          const gradedDate = testProgress.attempts[0]?.timestamp 
            ? format(new Date(testProgress.attempts[0].timestamp), "PP") 
            : "N/A";

          return (
            <Card key={unitId} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-xl mb-1">{unitTitle} - Test</CardTitle>
                  <Badge variant={score >= 80 ? "default" : (score >=50 ? "secondary" : "destructive")} className="whitespace-nowrap">
                    {score.toFixed(0)}%
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  Graded on: {gradedDate}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  This score reflects your performance on the offline test for {unitDescription}.
                </p>
              </CardContent>
              <CardFooter>
                <Link href={`/student/units/${unitId}`} passHref className="w-full">
                    <Button 
                        className="w-full" 
                        variant="outline"
                    >
                      <Percent className="mr-2 h-4 w-4" /> View Unit Details
                    </Button>
                  </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}





    