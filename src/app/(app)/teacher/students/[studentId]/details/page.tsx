
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mockStudents } from '@/lib/mock-data';
import { courseUnits } from '@/lib/course-data';
import { getStudentProgressForUnit, getOverallStudentProgress, type StudentProgressSummary } from '@/lib/progress-utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle, Percent, UserCircle, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function TeacherStudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { teacherData } = useAuth();

  const studentId = params.studentId as string;
  const student = mockStudents.find(s => s.id === studentId);

  if (!teacherData) return <div className="p-8 text-center">Loading teacher data...</div>;
  if (!student) return <div className="p-8 text-center">Student not found.</div>;

  const overallProgressSummary = getOverallStudentProgress(student.id);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.push('/teacher/students')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Student List
      </Button>

      <Card className="shadow-xl mb-8">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-3xl font-headline text-foreground">{student.name}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">@{student.username}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                  <Percent className="mr-2 h-4 w-4" /> Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{overallProgressSummary.overallAverageCompletion.toFixed(0)}%</p>
                <Progress value={overallProgressSummary.overallAverageCompletion} className="h-2 mt-1" />
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                  <CheckCircle className="mr-2 h-4 w-4" /> Units Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overallProgressSummary.completedUnits} / {overallProgressSummary.totalUnits}</p>
              </CardContent>
            </Card>
             <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                  <UserCircle className="mr-2 h-4 w-4" /> Hints Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-accent">{student.hintsRemaining}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <h2 className="text-2xl font-headline mb-4 text-foreground">Unit Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courseUnits.map(unit => {
          const unitProgress = getStudentProgressForUnit(student.id, unit.id);
          const completion = unitProgress?.overallCompletion ?? 0;
          const isCompleted = completion >= 100;

          return (
            <Card key={unit.id} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-lg">{unit.title}</CardTitle>
                  {isCompleted && <CheckCircle className="h-5 w-5 text-primary" />}
                </div>
                <CardDescription>{unit.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Progress value={completion} className="h-2.5" />
                <p className="text-sm text-muted-foreground mt-1 text-right">{completion.toFixed(0)}% Complete</p>
              </CardContent>
              <CardFooter>
                <Link href={`/teacher/students/${student.id}/progress/${unit.id}`} passHref className="w-full">
                  <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" /> View Detailed Progress
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
