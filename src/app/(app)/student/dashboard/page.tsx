"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { courseUnits } from '@/lib/course-data';
import type { Unit, Message } from '@/types'; // Removed UnitTest type
import Image from 'next/image';
import { Lock, CheckCircle, PlayCircle, BarChartHorizontalBig, MessageCircle, Info, GraduationCap, Hourglass, ListChecks, RefreshCw } from 'lucide-react';
import { getStudentProgressForUnit, getOverallStudentProgress, StudentProgressSummary } from '@/lib/progress-utils';
import { useEffect, useState } from 'react';
import { mockUnitTests, getMockMessages } from '@/lib/mock-data'; // mockUnitTests is now empty or for conceptual tests
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const isUnitActuallyLocked = (unit: Unit): boolean => {
  if (!unit.unlockDate) return unit.isLocked;
  const today = new Date();
  today.setHours(0,0,0,0);

  const unitUnlockDateTime = new Date(unit.unlockDate);
  unitUnlockDateTime.setHours(18,0,0,0);

  return new Date() < unitUnlockDateTime;
};


export default function StudentDashboardPage() {
  const { studentData, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast(); // Keep toast for other notifications if any
  const [progressSummary, setProgressSummary] = useState<StudentProgressSummary | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (studentData) {
      const summary = getOverallStudentProgress(studentData.id);
      setProgressSummary(summary);
    }
  }, [studentData]);

  useEffect(() => {
    if (user) {
        const messages = getMockMessages(user.id, user.role);
        // Filter for messages TO this user or announcements FOR students, that are unread
        const currentUnread = messages.filter(msg => 
            ((msg.recipientId === user.id || (msg.recipientId === 'all_students' && user.role === 'student'))) 
            && !msg.isRead 
            && msg.senderId !== user.id // Don't count own messages for the badge
        ).length;
        setUnreadMessagesCount(currentUnread);
    } else {
        setUnreadMessagesCount(0);
    }
  }, [user]); // Re-check when user changes (e.g. login/logout) or messages are fetched


  if (!studentData || !user) {
    return <div className="text-center p-8">Loading student data...</div>;
  }

  const unlockedUnits = courseUnits.filter(unit => !isUnitActuallyLocked(unit));
  const lockedUnitsCount = courseUnits.length - unlockedUnits.length;
  
  // Count conceptual "tests" based on unit test scores.
  // This counts units for which a test score has been entered.
  const assignedTestsCount = courseUnits.reduce((count, unit) => {
    const progress = getStudentProgressForUnit(studentData.id, unit.id);
    if (progress?.unitTest && progress.unitTest.completed) {
      return count + 1;
    }
    return count;
  }, 0);


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-headline mb-8 text-foreground">Welcome, {studentData.name}!</h1>

      {/* Online test notification card removed */}

      {/* Developer Actions card removed as online test simulation is no longer relevant */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><PlayCircle className="text-primary"/> Current Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{progressSummary?.overallAverageCompletion.toFixed(0) ?? 0}%</p>
            <p className="text-sm text-muted-foreground">Completed {progressSummary?.completedUnits ?? 0} of {courseUnits.length} units (homework).</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><BarChartHorizontalBig className="text-accent"/> Hints Remaining</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-semibold text-accent">{studentData.hintsRemaining}</p>
             <p className="text-sm text-muted-foreground">Use them wisely!</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><GraduationCap className="text-secondary-foreground"/> My Test Scores</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-semibold text-secondary-foreground">{assignedTestsCount}</p>
             <p className="text-sm text-muted-foreground">tests graded</p>
             <Link href="/student/tests"><Button variant="link" className="p-0 h-auto text-sm">View Scores</Button></Link>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><MessageCircle className="text-secondary-foreground"/> Messages</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-semibold text-secondary-foreground">{unreadMessagesCount}</p>
             <Link href="/messages"><Button variant="link" className="p-0 h-auto text-sm">{unreadMessagesCount > 0 ? `View ${unreadMessagesCount} new message${unreadMessagesCount > 1 ? 's' : ''}` : "View Messages"}</Button></Link>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-headline mb-6 text-foreground">Your Units</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {unlockedUnits.map((unit) => {
          const unitProgress = studentData ? getStudentProgressForUnit(studentData.id, unit.id) : null;
          const isCompleted = unitProgress && unitProgress.overallCompletion >= 100; // Based on homework rounds
          return (
            <Card key={unit.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader className="relative p-0">
                <Image
                  src={`https://placehold.co/600x400.png?bg=${isCompleted ? '40BF40' : 'A8D9A8'}&text=${encodeURIComponent(unit.title)}`}
                  alt={unit.title}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                  data-ai-hint={unit.imagePlaceholder || "learning education"}
                />
                {isCompleted && <CheckCircle className="absolute top-2 right-2 h-8 w-8 text-white bg-green-500 rounded-full p-1" />}
              </CardHeader>
              <CardContent className="pt-4 flex-grow">
                <CardTitle className="font-headline text-xl mb-1">{unit.title}</CardTitle>
                <CardDescription className="text-muted-foreground mb-2 text-sm">{unit.description}</CardDescription>
                <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${unitProgress?.overallCompletion.toFixed(0) ?? 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground text-right">{unitProgress?.overallCompletion.toFixed(0) ?? 0}% Homework Complete</p>
              </CardContent>
              <CardFooter className="pt-0">
                 <Link href={`/student/units/${unit.id}`} passHref className="w-full">
                  <Button className="w-full" variant={isCompleted ? "secondary" : "default"}>
                    {isCompleted ? 'Review Unit' : 'Start Learning'}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}

        {Array.from({ length: lockedUnitsCount }).map((_, index) => (
           <Card key={`locked-${index}`} className="overflow-hidden shadow-lg bg-muted/50 flex flex-col items-center justify-center p-6">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="font-headline text-xl mb-1 text-muted-foreground">Unit Locked</CardTitle>
            <CardDescription className="text-center text-muted-foreground text-sm">This unit will be available soon. Keep up the great work!</CardDescription>
          </Card>
        ))}
      </div>
    </div>
  );
}
    
    



    