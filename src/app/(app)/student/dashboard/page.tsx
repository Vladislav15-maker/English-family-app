"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { courseUnits } from '@/lib/course-data';
import type { Unit, UnitTest, Message } from '@/types';
import Image from 'next/image';
import { Lock, CheckCircle, PlayCircle, BarChartHorizontalBig, Users, MessageCircle, AlertTriangle, Info, GraduationCap } from 'lucide-react';
import { getStudentProgressForUnit, getOverallStudentProgress, StudentProgressSummary } from '@/lib/progress-utils';
import { useEffect, useState } from 'react';
import { mockStudents, mockUnitTests, getMockMessages } from '@/lib/mock-data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Helper to calculate unlock status more dynamically if needed in future
const isUnitActuallyLocked = (unit: Unit): boolean => {
  if (!unit.unlockDate) return unit.isLocked; // Fallback to static lock
  const today = new Date();
  today.setHours(0,0,0,0); // Compare dates only
  
  const unitUnlockDateTime = new Date(unit.unlockDate);
  unitUnlockDateTime.setHours(18,0,0,0); // Set to 6 PM on unlock day

  return new Date() < unitUnlockDateTime;
};


export default function StudentDashboardPage() {
  const { studentData, user } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();
  const [progressSummary, setProgressSummary] = useState<StudentProgressSummary | null>(null);
  const [activeTestNotification, setActiveTestNotification] = useState<UnitTest | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (studentData) {
      const summary = getOverallStudentProgress(studentData.id);
      setProgressSummary(summary);

      // Check for active tests relevant to the student
      const currentActiveTest = mockUnitTests.find(test => 
        test.status === 'active' && 
        (!test.forStudentId || test.forStudentId === studentData.id) &&
        (!test.forGroupId /* add group check if implemented */ ) 
      );
      setActiveTestNotification(currentActiveTest || null);
    }
    if (user) {
      const messages = getMockMessages(user.id, user.role);
      setUnreadMessagesCount(messages.filter(msg => !msg.isRead && msg.recipientId === user.id).length);
    }
  }, [studentData, user]);


  const simulateTeacherStartsTest = () => {
    const availableTest = mockUnitTests.find(test => test.status === 'active' );
    if (availableTest) {
      setActiveTestNotification(availableTest);
       toast({ title: "Test Active!", description: `Test "${availableTest.title}" is now active. You can join from the notification.`});
    } else {
      toast({ title: "No Active Test", description: "No suitable active test found for simulation.", variant: "default" });
      setActiveTestNotification(null); // Clear notification if no active test
    }
  };

  if (!studentData) {
    return <div className="text-center p-8">Loading student data...</div>;
  }
  
  const unlockedUnits = courseUnits.filter(unit => !isUnitActuallyLocked(unit)); 
  const lockedUnitsCount = courseUnits.length - unlockedUnits.length;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-headline mb-8 text-foreground">Welcome, {studentData.name}!</h1>

      {activeTestNotification && (
        <Alert className="mb-6 border-primary shadow-lg">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <AlertTitle className="font-headline text-xl text-primary">Test Starting Soon!</AlertTitle>
          <AlertDescription className="text-foreground">
            Your teacher has started the test: <span className="font-semibold">{activeTestNotification.title}</span>.
            <Button 
              onClick={() => router.push(`/student/tests/${activeTestNotification.id}/waiting`)} 
              className="mt-3 w-full sm:w-auto ml-0 sm:ml-4"
              size="sm"
            >
              Join Waiting Room
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center"><Info className="mr-2 h-5 w-5 text-accent"/>Developer Actions</CardTitle>
        </CardHeader>
        <CardContent>
            <Button onClick={simulateTeacherStartsTest} variant="outline">
                Simulate Teacher Starts Active Test
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
                This button is for demonstration. It makes an already 'active' test show its notification. In a real app, test initiation would be triggered by the teacher.
            </p>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><PlayCircle className="text-primary"/> Current Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{progressSummary?.overallAverageCompletion.toFixed(0) ?? 0}%</p>
            <p className="text-sm text-muted-foreground">Completed {progressSummary?.completedUnits ?? 0} of {courseUnits.length} units.</p>
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
            <CardTitle className="flex items-center gap-2 font-headline"><GraduationCap className="text-secondary-foreground"/> My Tests</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-semibold text-secondary-foreground">{mockUnitTests.length}</p>
             <p className="text-sm text-muted-foreground">tests assigned</p>
             <Link href="/student/tests"><Button variant="link" className="p-0 h-auto">View Tests</Button></Link>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><MessageCircle className="text-secondary-foreground"/> Messages</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-semibold text-secondary-foreground">{unreadMessagesCount}</p>
             <Link href="/messages"><Button variant="link" className="p-0 h-auto">View Messages</Button></Link>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-2xl font-headline mb-6 text-foreground">Your Units</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {unlockedUnits.map((unit) => {
          const unitProgress = studentData ? getStudentProgressForUnit(studentData.id, unit.id) : null;
          const isCompleted = unitProgress && unitProgress.overallCompletion >= 100;
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
                <CardDescription className="text-muted-foreground mb-2">{unit.description}</CardDescription>
                <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${unitProgress?.overallCompletion.toFixed(0) ?? 0}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground text-right">{unitProgress?.overallCompletion.toFixed(0) ?? 0}% Complete</p>
              </CardContent>
              <CardContent className="pt-0">
                 <Link href={`/student/units/${unit.id}`} passHref>
                  <Button className="w-full" variant={isCompleted ? "secondary" : "default"}>
                    {isCompleted ? 'Review Unit' : 'Start Learning'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}

        {Array.from({ length: lockedUnitsCount }).map((_, index) => (
           <Card key={`locked-${index}`} className="overflow-hidden shadow-lg bg-muted/50 flex flex-col items-center justify-center p-6">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="font-headline text-xl mb-1 text-muted-foreground">Unit Locked</CardTitle>
            <CardDescription className="text-center text-muted-foreground">This unit will be available soon. Keep up the great work!</CardDescription>
          </Card>
        ))}
      </div>
    </div>
  );
}


    