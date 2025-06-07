"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { courseUnits } from '@/lib/course-data';
import type { Unit, UnitTest, Message } from '@/types';
import Image from 'next/image';
import { Lock, CheckCircle, PlayCircle, BarChartHorizontalBig, MessageCircle, AlertTriangle, Info, GraduationCap, Hourglass } from 'lucide-react';
import { getStudentProgressForUnit, getOverallStudentProgress, StudentProgressSummary } from '@/lib/progress-utils';
import { useEffect, useState } from 'react';
import { mockUnitTests, getMockMessages, mockStudents } from '@/lib/mock-data'; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const { toast } = useToast();
  const [progressSummary, setProgressSummary] = useState<StudentProgressSummary | null>(null);
  const [activeTestNotification, setActiveTestNotification] = useState<UnitTest | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (studentData) {
      const summary = getOverallStudentProgress(studentData.id);
      setProgressSummary(summary);
    }
    if (user) {
      const messages = getMockMessages(user.id, user.role);
      const currentUnread = messages.filter(msg => !msg.isRead && (msg.recipientId === user.id || (msg.recipientId === 'all_students' && user.role === 'student'))).length;
      setUnreadMessagesCount(currentUnread);
    }
  }, [studentData, user]); 

   useEffect(() => {
    if (!studentData) return;

    const interval = setInterval(() => {
      // Log the current state of mockUnitTests as seen by this interval
      console.log("[Student Dashboard Interval Check] Checking for active tests. mockUnitTests snapshot:", JSON.parse(JSON.stringify(mockUnitTests.map(t => ({id: t.id, title: t.title, status: t.status})))));

      const relevantTest = mockUnitTests.find(test => 
        (test.status === 'waiting_room_open' || test.status === 'active') &&
        (!test.forStudentId || test.forStudentId === studentData.id) &&
        (!test.forGroupId /* add group check if implemented */ ) 
      );
      
      if (relevantTest) {
        console.log("[Student Dashboard Interval Check] Relevant test found:", {id: relevantTest.id, status: relevantTest.status, title: relevantTest.title});
        setActiveTestNotification(prev => {
            if(prev?.id !== relevantTest.id || prev?.status !== relevantTest.status){
                return {...relevantTest}; // Create a new object
            }
            return prev; // Keep existing object if no change to relevant properties
        });
      } else {
        console.log("[Student Dashboard Interval Check] No relevant test found with status waiting_room_open or active.");
        setActiveTestNotification(null);
      }
    }, 2000); 

    return () => {
      console.log("[Student Dashboard] Clearing test check interval.");
      clearInterval(interval);
    };
  }, [studentData]); 


  const simulateTeacherOpensWaitingRoom = () => {
    if (!studentData) return;
    // Find a test that is 'pending' and relevant to this student
    const pendingTestIndex = mockUnitTests.findIndex(test => 
        test.status === 'pending' && 
        (!test.forStudentId || test.forStudentId === studentData.id) &&
        (!test.forGroupId) // Assuming no group logic for now
    );

    if (pendingTestIndex !== -1) {
      mockUnitTests[pendingTestIndex].status = 'waiting_room_open';
      // The interval useEffect should pick this up and update activeTestNotification
      toast({ title: "Waiting Room Open (Simulated)!", description: `Test "${mockUnitTests[pendingTestIndex].title}" is now open for joining.`});
      console.log('[Simulate] Opened waiting room for test:', mockUnitTests[pendingTestIndex].title, 'New status:', mockUnitTests[pendingTestIndex].status);
      console.log('[Simulate] Current mockUnitTests:', JSON.parse(JSON.stringify(mockUnitTests.map(t => ({id: t.id, title: t.title, status: t.status})))));
    } else {
      toast({ title: "No Pending Test", description: "No suitable pending test found for simulation.", variant: "default" });
    }
  };
  
  const simulateTeacherStartsActiveTestFromWaitingRoom = () => {
     if (!studentData) return;
     const waitingTestIndex = mockUnitTests.findIndex(test => 
        test.status === 'waiting_room_open' && 
        (!test.forStudentId || test.forStudentId === studentData.id) &&
        (!test.forGroupId)
    );
     if (waitingTestIndex !== -1) {
        mockUnitTests[waitingTestIndex].status = 'active';
        mockUnitTests[waitingTestIndex].startTime = new Date();
        // The interval useEffect should pick this up
        toast({ title: "Test Active (Simulated)!", description: `Test "${mockUnitTests[waitingTestIndex].title}" is now active.`});
        console.log('[Simulate] Started test:', mockUnitTests[waitingTestIndex].title, 'New status:', mockUnitTests[waitingTestIndex].status);
        console.log('[Simulate] Current mockUnitTests:', JSON.parse(JSON.stringify(mockUnitTests.map(t => ({id: t.id, title: t.title, status: t.status})))));
     } else {
        const activeTest = mockUnitTests.find(test => test.status === 'active' && (!test.forStudentId || test.forStudentId === studentData.id));
        if(activeTest) {
            toast({ title: "Test Already Active", description: `Test "${activeTest.title}" is active.`});
        } else {
            toast({ title: "No Test in Waiting Room", description: "No test is currently in 'waiting_room_open' state for simulation.", variant: "default" });
        }
     }
  };

  if (!studentData || !user) { 
    return <div className="text-center p-8">Loading student data...</div>;
  }
  
  const unlockedUnits = courseUnits.filter(unit => !isUnitActuallyLocked(unit)); 
  const lockedUnitsCount = courseUnits.length - unlockedUnits.length;

  const getNotificationAlert = () => {
    if (!activeTestNotification) return null;

    let title = "";
    let description = "";
    let buttonText = "";
    let buttonAction = () => {};
    let icon = <AlertTriangle className="h-5 w-5 text-primary" />;

    if (activeTestNotification.status === 'waiting_room_open') {
      title = "Test Waiting Room Open!";
      description = `Your teacher has opened the waiting room for the test: ${activeTestNotification.title}.`;
      buttonText = "Join Waiting Room";
      buttonAction = () => router.push(`/student/tests/${activeTestNotification.id}/waiting`);
      icon = <Hourglass className="h-5 w-5 text-primary animate-pulse" />;
    } else if (activeTestNotification.status === 'active') {
      title = "Test In Progress!";
      description = `The test "${activeTestNotification.title}" is currently active.`;
      // If student is already in waiting room, they get redirected. If not, they can join active test via waiting page first.
      buttonText = "Go to Test"; 
      buttonAction = () => router.push(`/student/tests/${activeTestNotification.id}/waiting`); 
      icon = <PlayCircle className="h-5 w-5 text-green-500" />;
    } else {
        return null; 
    }

    return (
      <Alert className="mb-6 border-primary shadow-lg">
        <div className="flex items-center gap-3">
            {icon}
            <div>
                <AlertTitle className="font-headline text-lg text-primary">{title}</AlertTitle>
                <AlertDescription className="text-foreground text-sm">
                {description}
                </AlertDescription>
            </div>
        </div>
        <Button 
            onClick={buttonAction} 
            className="mt-3 w-full sm:w-auto"
            size="sm"
        >
            {buttonText}
        </Button>
      </Alert>
    );
  };

  const assignedTestsCount = mockUnitTests.filter(t => !t.forStudentId || t.forStudentId === studentData.id).length;


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-headline mb-8 text-foreground">Welcome, {studentData.name}!</h1>

      {getNotificationAlert()}

      <Card className="mb-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center"><Info className="mr-2 h-5 w-5 text-accent"/>Developer Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
            <Button onClick={simulateTeacherOpensWaitingRoom} variant="outline" size="sm">
                Simulate Teacher Opens Waiting Room (for a 'pending' test)
            </Button>
            <Button onClick={simulateTeacherStartsActiveTestFromWaitingRoom} variant="outline" size="sm">
                Simulate Teacher Starts Active Test (from 'waiting_room_open')
            </Button>
            <p className="text-xs text-muted-foreground mt-2 w-full">
                These buttons simulate teacher actions for testing notifications. They affect the first suitable test.
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
             <p className="text-2xl font-semibold text-secondary-foreground">{assignedTestsCount}</p>
             <p className="text-sm text-muted-foreground">tests assigned</p>
             <Link href="/student/tests"><Button variant="link" className="p-0 h-auto text-sm">View Tests</Button></Link>
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
                <CardDescription className="text-muted-foreground mb-2 text-sm">{unit.description}</CardDescription>
                <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${unitProgress?.overallCompletion.toFixed(0) ?? 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground text-right">{unitProgress?.overallCompletion.toFixed(0) ?? 0}% Complete</p>
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


    