"use client";

import { useAuth } from '@/context/AuthContext';
import { mockUnitTests } from '@/lib/mock-data';
import { getUnitById } from '@/lib/course-data';
import { getStudentProgressForUnit } from '@/lib/progress-utils';
import type { UnitTest as UnitTestType, StudentRoundProgress } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Clock, CheckCircle, ListChecks, ArrowLeft, XCircle, Hourglass, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function StudentTestsPage() {
  const { studentData } = useAuth();
  const router = useRouter();

  if (!studentData) {
    return <div className="text-center p-8">Loading student data...</div>;
  }

  const availableTests = mockUnitTests; // In a real app, filter by student assignment

  const getTestStatusInfo = (test: UnitTestType, studentTestProgress?: StudentRoundProgress) => {
    const lastAttemptTimestamp = studentTestProgress?.attempts && studentTestProgress.attempts.length > 0 
        ? studentTestProgress.attempts[studentTestProgress.attempts.length - 1].timestamp 
        : null;

    if (studentTestProgress?.completed) {
      return { 
        text: `Completed: ${studentTestProgress.score.toFixed(0)}%`, 
        badgeVariant: "default" as const,
        actionText: "View Results",
        actionLink: `/student/tests/${test.id}/results`,
        actionIcon: <ListChecks className="mr-2 h-4 w-4" />,
        disabled: false,
        dateInfo: lastAttemptTimestamp ? `Taken: ${format(new Date(lastAttemptTimestamp), "PP")}` : ""
      };
    }
    if (test.status === 'active') {
      return { 
        text: "Active", 
        badgeVariant: "secondary" as const,
        actionText: "Join Waiting Room", 
        actionLink: `/student/tests/${test.id}/waiting`,
        actionIcon: <Play className="mr-2 h-4 w-4" />, 
        disabled: false, // Student can attempt to join
        dateInfo: `Duration: ${test.durationMinutes} min. Teacher has started this test.`
      };
    }
    if (test.status === 'pending') {
      return { 
        text: "Scheduled", 
        badgeVariant: "outline" as const,
        actionText: "Not Yet Started",
        actionIcon: <Clock className="mr-2 h-4 w-4" />,
        disabled: true,
        dateInfo: test.assignedDate ? `From: ${format(new Date(test.assignedDate), "PP")}` : "Awaiting teacher"
      };
    }
    // Teacher marked as completed or expired (test.status === 'completed' or other)
    return { 
        text: "Ended", 
        badgeVariant: "destructive" as const,
        actionText: "Test Ended",
        actionIcon: <XCircle className="mr-2 h-4 w-4" />,
        disabled: true,
        dateInfo: test.endTime ? `Ended: ${format(new Date(test.endTime), "PPp")}` : "Teacher marked as completed"
    };
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="flex items-center mb-8">
        <GraduationCap className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-headline text-foreground">My Tests</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        View your assigned tests and results. Active tests can be joined from here or your dashboard when started by the teacher.
      </p>

      {availableTests.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">No tests assigned to you at the moment.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableTests.map((test) => {
          const unit = getUnitById(test.unitId);
          const studentTestProgressForThisTest = getStudentProgressForUnit(studentData.id, test.unitId)?.unitTest?.roundId === test.id 
            ? getStudentProgressForUnit(studentData.id, test.unitId)?.unitTest 
            : undefined;
          const statusInfo = getTestStatusInfo(test, studentTestProgressForThisTest);
          
          return (
            <Card key={test.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-xl mb-1">{test.title}</CardTitle>
                  {statusInfo.badgeVariant && <Badge variant={statusInfo.badgeVariant}>{statusInfo.text}</Badge>}
                </div>
                <CardDescription>
                  For Unit: {unit?.title || 'N/A'} <br />
                  {statusInfo.dateInfo}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  This test covers material from {unit?.description || test.unitId}. 
                  It has {test.questions.length} questions.
                </p>
              </CardContent>
              <CardFooter>
                {statusInfo.actionLink ? (
                  <Link href={statusInfo.actionLink} passHref className="w-full">
                    <Button className="w-full" variant={studentTestProgressForThisTest?.completed ? "secondary" : "default"} disabled={statusInfo.disabled}>
                      {statusInfo.actionIcon} {statusInfo.actionText}
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" disabled={statusInfo.disabled} variant="outline">
                     {statusInfo.actionIcon} {statusInfo.actionText}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}



    