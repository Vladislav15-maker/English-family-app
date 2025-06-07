
"use client";

import React from 'react'; // Added React import
import { useAuth } from '@/context/AuthContext';
import { mockStudents } from '@/lib/mock-data';
import { courseUnits } from '@/lib/course-data';
import { getOverallStudentProgress, getStudentProgressForUnit } from '@/lib/progress-utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function StudentClassPage() {
  const { studentData: currentUserData } = useAuth(); // Renamed to avoid conflict
  const router = useRouter();

  if (!currentUserData) {
    return <div className="text-center p-8">Loading student data...</div>;
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <h1 className="text-3xl font-headline mb-2 text-foreground">My Class</h1>
      <p className="text-muted-foreground mb-8">View your classmates' progress across different units.</p>
      
      <Card className="shadow-xl">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Student</TableHead>
                <TableHead className="text-center min-w-[150px]">Overall Progress</TableHead>
                {courseUnits.map(unit => (
                  <React.Fragment key={unit.id}>
                    <TableHead className="text-center min-w-[100px]">{unit.title} HW</TableHead>
                    <TableHead className="text-center min-w-[100px]">{unit.title} Test</TableHead>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStudents.map(student => {
                const progressSummary = getOverallStudentProgress(student.id);
                const isCurrentUser = student.id === currentUserData.id;
                return (
                  <TableRow key={student.id} className={isCurrentUser ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-10 w-10 border-2 ${isCurrentUser ? 'border-primary' : 'border-muted'}`}>
                          <AvatarFallback 
                              className={`${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} font-semibold`}
                          >
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name} {isCurrentUser ? "(You)" : ""}</p>
                          <p className="text-xs text-muted-foreground">@{student.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <Progress value={progressSummary.overallAverageCompletion} className="w-24 h-2.5 mb-1" aria-label={`Overall progress ${progressSummary.overallAverageCompletion.toFixed(0)}%`} />
                        <span className="text-sm">{progressSummary.overallAverageCompletion.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    {courseUnits.map(unit => {
                      const unitProgress = getStudentProgressForUnit(student.id, unit.id);
                      const hwCompletion = unitProgress?.overallCompletion ?? 0;
                      const testScore = unitProgress?.unitTest?.score;

                      return (
                        <React.Fragment key={`${student.id}-${unit.id}-details`}>
                          <TableCell className="text-center">
                            <span className={cn(
                              "text-sm",
                              hwCompletion < 80 && hwCompletion > 0 ? "text-red-600 dark:text-red-500 font-semibold" : "",
                              hwCompletion === 0 ? "text-muted-foreground" : ""
                            )}>
                              {hwCompletion > 0 ? `${hwCompletion.toFixed(0)}%` : '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {typeof testScore === 'number' ? (
                               <span className="text-sm text-yellow-600 dark:text-yellow-500 font-semibold">
                                {`${testScore.toFixed(0)}%`}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
