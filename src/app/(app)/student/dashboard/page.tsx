"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'; // Ensure CardFooter is here
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { courseUnits } from '@/lib/course-data';
import type { Unit, UnitTest, Message } from '@/types';
import Image from 'next/image';
import { Lock, CheckCircle, PlayCircle, BarChartHorizontalBig, MessageCircle, Info, GraduationCap, Hourglass, ListChecks, RefreshCw } from 'lucide-react';
import { getStudentProgressForUnit, getOverallStudentProgress, StudentProgressSummary } from '@/lib/progress-utils';
import { useEffect, useState } from 'react';
import { mockUnitTests, getMockMessages } from '@/lib/mock-data';
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
  const [joinableTests, setJoinableTests] = useState<UnitTest[]>([]);
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
        const currentUnread = messages.filter(msg => !msg.isRead && (msg.recipientId === user.id || (msg.recipientId === 'all_students' && user.role === 'student'))).length;
        setUnreadMessagesCount(currentUnread);
    } else {
        setUnreadMessagesCount(0);
    }
  }, [user]);

   useEffect(() => {
    if (!studentData) {
      console.log('[Student Dashboard Interval Setup] studentData is null, interval not starting.');
      return;
    }
    console.log('[Student Dashboard Interval Setup] studentData loaded, starting interval for student:', studentData.id);

    const interval = setInterval(() => {
      // Create a deep copy for reliable comparison and to avoid unintended mutations if any part of the system relies on object identity.
      const currentTestsSnapshot = JSON.parse(JSON.stringify(mockUnitTests)) as UnitTest[];
      // console.log('[Student Dashboard Interval Check] Raw mockUnitTests:', JSON.parse(JSON.stringify(mockUnitTests.map(t => ({id: t.id, status:t.status, title:t.title})))));
      // console.log('[Student Dashboard Interval Check] currentTestsSnapshot from interval:', currentTestsSnapshot.map(t=> ({id:t.id, title: t.title, status:t.status})));


      const relevantTests = currentTestsSnapshot.filter(test =>
        (test.status === 'waiting_room_open' || test.status === 'active') &&
        (!test.forStudentId || test.forStudentId === studentData.id) &&
        (!test.forGroupId /* add group check if implemented */ )
      );
      // console.log('[Student Dashboard Interval Check] Filtered relevantTests:', relevantTests.map(t=> ({id:t.id, title: t.title, status:t.status})));
      
      setJoinableTests(prevTests => {
        const relevantTestIdsAndStatuses = relevantTests.map(t => `${t.id}-${t.status}`).sort().join(',');
        const prevTestIdsAndStatuses = prevTests.map(t => `${t.id}-${t.status}`).sort().join(',');

        if (relevantTestIdsAndStatuses !== prevTestIdsAndStatuses) {
          console.log('[Student Dashboard Interval Check] Updating joinableTests. New relevant tests:', relevantTests.map(t=>({id: t.id, status: t.status, title:t.title})), 'Previous joinableTests:', prevTests.map(t=>({id: t.id, status: t.status, title:t.title})));
          return [...relevantTests]; // Ensure a new array reference
        }
        return prevTests;
      });

    }, 2000); // Check every 2 seconds

    return () => {
      console.log('[Student Dashboard Interval Cleanup] Clearing interval for student:', studentData?.id);
      clearInterval(interval);
    };
  }, [studentData]);


  const simulateTeacherOpensWaitingRoom = () => {
    if (!studentData) return;
    const pendingTestIndex = mockUnitTests.findIndex(test =>
        test.status === 'pending' &&
        (!test.forStudentId || test.forStudentId === studentData.id) &&
        (!test.forGroupId)
    );

    if (pendingTestIndex !== -1) {
      mockUnitTests[pendingTestIndex].status = 'waiting_room_open';
      toast({ title: "Waiting Room Now Open (Simulated)", description: `Test "${mockUnitTests[pendingTestIndex].title}" is ready to join.`});
      console.log('[Simulate] Opened waiting room for test:', mockUnitTests[pendingTestIndex].title, 'New status:', mockUnitTests[pendingTestIndex].status);
      console.log('[Simulate] mockUnitTests after opening waiting room:', JSON.parse(JSON.stringify(mockUnitTests.map(t => ({id: t.id, title: t.title, status: t.status})))));
    } else {
      toast({ title: "No Pending Test Found", description: "Could not find a 'pending' test to open for simulation.", variant: "default" });
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
        toast({ title: "Test Now Active (Simulated)", description: `Test "${mockUnitTests[waitingTestIndex].title}" has started.`});
        console.log('[Simulate] Started test:', mockUnitTests[waitingTestIndex].title, 'New status:', mockUnitTests[waitingTestIndex].status);
        console.log('[Simulate] mockUnitTests after starting test:', JSON.parse(JSON.stringify(mockUnitTests.map(t => ({id: t.id, title: t.title, status: t.status})))));
     } else {
        const activeTest = mockUnitTests.find(test => test.status === 'active' && (!test.forStudentId || test.forStudentId === studentData.id));
        if(activeTest) {
            toast({ title: "Test Already Active", description: `Test "${activeTest.title}" is currently active.`});
        } else {
            toast({ title: "No Test in Waiting Room", description: "No test found in 'waiting_room_open' state for simulation.", variant: "default" });
        }
     }
  };

  const handleManualLogMockTests = () => {
    if (!studentData) {
      console.log('[MANUAL LOG] studentData is null. Cannot effectively log tests.');
      return;
    }
    console.log('[MANUAL LOG] Current studentData.id:', studentData.id);
    const currentGlobalMockTests = JSON.parse(JSON.stringify(mockUnitTests)) as UnitTest[];
    console.log('[MANUAL LOG] Global mockUnitTests (snapshot):', currentGlobalMockTests.map(t => ({id: t.id, status: t.status, title: t.title, forStudentId: t.forStudentId })));
    
    const relevantTestsFromGlobal = currentGlobalMockTests.filter(test =>
      (test.status === 'waiting_room_open' || test.status === 'active') &&
      (!test.forStudentId || test.forStudentId === studentData.id) &&
      (!test.forGroupId)
    );
    console.log('[MANUAL LOG] Filtered relevant tests from global snapshot:', relevantTestsFromGlobal.map(t => ({id: t.id, status: t.status, title: t.title})));
    console.log('[MANUAL LOG] Current joinableTests state:', joinableTests.map(t => ({id: t.id, status: t.status, title: t.title})));
  };


  if (!studentData || !user) {
    return <div className="text-center p-8">Loading student data...</div>;
  }

  const unlockedUnits = courseUnits.filter(unit => !isUnitActuallyLocked(unit));
  const lockedUnitsCount = courseUnits.length - unlockedUnits.length;
  const assignedTestsCount = mockUnitTests.filter(t => !t.forStudentId || t.forStudentId === studentData.id).length;


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-headline mb-8 text-foreground">Welcome, {studentData.name}!</h1>

      {joinableTests.length > 0 && (
        <Card className="mb-8 shadow-xl border-2 border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <ListChecks className="mr-3 h-7 w-7" />
              Active Tests & Waiting Rooms
            </CardTitle>
            <CardDescription className="text-primary/80">
              You have tests that are open or currently active. Join them now!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {joinableTests.map(test => (
              <Card key={test.id} className="bg-background shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{test.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Status: <span className={`font-medium ${test.status === 'active' ? 'text-green-600 dark:text-green-500' : 'text-orange-600 dark:text-orange-500'}`}>
                                {test.status === 'active' ? 'Active - In Progress' : 'Waiting Room Open'}
                              </span>
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push(`/student/tests/${test.id}/waiting`)}
                    size="sm"
                    variant={test.status === 'active' ? 'default' : 'outline'}
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    {test.status === 'active' ? <PlayCircle className="mr-2 h-4 w-4" /> : <Hourglass className="mr-2 h-4 w-4" />}
                    {test.status === 'active' ? 'Go to Test' : 'Join Waiting Room'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mb-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center"><Info className="mr-2 h-5 w-5 text-accent"/>Developer Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button onClick={simulateTeacherOpensWaitingRoom} variant="outline" size="sm">
                  Simulate: Teacher Opens Waiting Room
              </Button>
              <Button onClick={simulateTeacherStartsActiveTestFromWaitingRoom} variant="outline" size="sm">
                  Simulate: Teacher Starts Active Test
              </Button>
            </div>
            <Button onClick={handleManualLogMockTests} variant="ghost" size="sm" className="self-start text-accent underline">
                <RefreshCw className="mr-2 h-4 w-4" /> Log Current mockUnitTests to Console
            </Button>
            <p className="text-xs text-muted-foreground mt-2 w-full">
                "Simulate" buttons affect the first suitable test. "Log" button shows data seen by this dashboard.
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
    
    



    