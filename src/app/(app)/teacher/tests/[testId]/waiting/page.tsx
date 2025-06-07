
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mockUnitTests, mockWaitingRoomParticipants, mockStudents } from '@/lib/mock-data';
import type { UnitTest as UnitTestType } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users, PlayCircle, Hourglass } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function TeacherTestWaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { teacherData } = useAuth();
  const { toast } = useToast();
  const testId = params.testId as string;

  const [testDetails, setTestDetails] = useState<UnitTestType | null>(null);
  const [participants, setParticipants] = useState<{ studentId: string; studentName: string; avatarFallback: string }[]>([]);

  useEffect(() => {
    const foundTest = mockUnitTests.find(t => t.id === testId);
    if (foundTest) {
      setTestDetails(foundTest);
      if (foundTest.status !== 'waiting_room_open' && foundTest.status !== 'active') {
        // If room is not open or test already active/completed, redirect or show message
        toast({title: "Info", description: `Test is currently ${foundTest.status}. Redirecting to test list.`, variant: "default"});
        router.replace('/teacher/tests');
      }
    } else {
      toast({title: "Error", description: "Test not found.", variant: "destructive"});
      router.replace('/teacher/tests');
    }

    // Simulate fetching participants or listen for updates
    const interval = setInterval(() => {
      setParticipants(mockWaitingRoomParticipants[testId] || []);
    }, 1500); // Refresh participants list periodically

    return () => clearInterval(interval);
  }, [testId, router, toast]);


  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const handleStartTestForAll = () => {
    const testIndex = mockUnitTests.findIndex(t => t.id === testId);
    if (testIndex > -1 && testDetails && testDetails.status === 'waiting_room_open') {
      mockUnitTests[testIndex].status = 'active';
      mockUnitTests[testId_dummy].startTime = new Date(); // Corrected: use testIndex or testId
      setTestDetails(prev => prev ? {...prev, status: 'active', startTime: new Date()} : null);
      toast({ title: "Test Started!", description: `"${testDetails.title}" is now active for all joined students.` });
      // Optionally, redirect teacher to a monitoring page or back to test list
      // router.push(`/teacher/tests/${testId}/monitoring`); // Example
    } else {
      toast({ title: "Error", description: "Could not start test. It might not be in 'waiting_room_open' state.", variant: "destructive" });
    }
  };
  
  // Correction for the line `mockUnitTests[testId].startTime = new Date();` -> `mockUnitTests[testIndex].startTime = new Date();`
  const testId_dummy = params.testId as string; // This is just to make TypeScript happy for the correction above


  if (!teacherData || !testDetails) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        Loading waiting room details...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
            {testDetails.status === 'waiting_room_open' ? (
                <Hourglass className="h-12 w-12 text-primary animate-pulse" />
            ) : (
                 <PlayCircle className="h-12 w-12 text-green-500" />
            )}
          </div>
          <CardTitle className="text-3xl font-headline">{testDetails.title}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {testDetails.status === 'waiting_room_open' ? "Waiting Room - Students are joining." : "Test is Active"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {testDetails.status === 'waiting_room_open' && (
            <div className="p-4 border bg-muted/50 rounded-lg text-center">
              <p className="text-foreground">Students can now join the waiting room for this test.</p>
              <p className="text-sm text-muted-foreground mt-1">Once enough students have joined, you can start the test for everyone.</p>
            </div>
          )}
           {testDetails.status === 'active' && (
            <div className="p-4 border bg-green-500/10 rounded-lg text-center">
              <p className="text-green-700 font-semibold">Test is now active for all participants!</p>
              <p className="text-sm text-green-600 mt-1">Students are now taking the test. Monitoring features will be here.</p>
            </div>
          )}


          <div>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center">
              <Users className="mr-2 h-6 w-6 text-primary" />
              Joined Participants ({participants.length})
            </h3>
            <ScrollArea className="h-60 rounded-md border p-3">
              {participants.length > 0 ? (
                <ul className="space-y-3">
                  {participants.map(participant => (
                    <li key={participant.studentId} className="flex items-center gap-3 p-2 bg-card rounded-md shadow-sm">
                      <Avatar className="h-10 w-10 border-2 border-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {participant.avatarFallback || getInitials(participant.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-card-foreground">{participant.studentName}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">No students have joined the waiting room yet.</p>
              )}
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-2">
          <Button variant="outline" onClick={() => router.push('/teacher/tests')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Test List
          </Button>
          {testDetails.status === 'waiting_room_open' && (
            <Button 
                onClick={handleStartTestForAll} 
                disabled={participants.length === 0} 
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
            >
              <PlayCircle className="mr-2 h-5 w-5" /> Start Test for All ({participants.length})
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
