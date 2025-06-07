"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mockUnitTests, mockStudents, mockWaitingRoomParticipants, mockTeacher } from '@/lib/mock-data';
import type { UnitTest as UnitTestType, Student } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users, CheckCircle, Hourglass, PlayCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function TestWaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { studentData } = useAuth();
  const { toast } = useToast();
  const testId = params.testId as string;

  const [testDetails, setTestDetails] = useState<UnitTestType | null>(null);
  const [participants, setParticipants] = useState<{ studentId: string; studentName: string; avatarFallback: string }[]>([]);
  const [testHasStarted, setTestHasStarted] = useState(false);

  useEffect(() => {
    const foundTest = mockUnitTests.find(t => t.id === testId);
    if (foundTest) {
      setTestDetails(foundTest);
      if (foundTest.status === 'pending') {
        toast({title: "Test Not Ready", description: "The teacher has not opened the waiting room yet.", variant: "default"});
        router.replace('/student/tests');
        return;
      }
      if (foundTest.status === 'active') {
        setTestHasStarted(true); // Test already started when joining
      }

      // Add student to participants list if not already there
      if (studentData && (!mockWaitingRoomParticipants[testId] || !mockWaitingRoomParticipants[testId].find(p => p.studentId === studentData.id))) {
        const currentUserMock = mockStudents.find(s => s.id === studentData.id);
        if (currentUserMock) {
            const names = currentUserMock.name.split(' ');
            const fallback = names.length > 1 ? `${names[0][0]}${names[names.length-1][0]}` : names[0].substring(0,2);
            const newParticipant = { studentId: studentData.id, studentName: studentData.name, avatarFallback: fallback.toUpperCase() };
            
            mockWaitingRoomParticipants[testId] = [...(mockWaitingRoomParticipants[testId] || []), newParticipant];
        }
      }
      setParticipants(mockWaitingRoomParticipants[testId] || []);

    } else {
      toast({title: "Error", description: "Test not found.", variant: "destructive"});
      router.replace('/student/dashboard');
    }
  }, [testId, studentData, router, toast]);

  // Periodically check if the teacher has started the test
  useEffect(() => {
    if (!testDetails || testDetails.status === 'active' || testHasStarted) return;

    const interval = setInterval(() => {
      const currentTestState = mockUnitTests.find(t => t.id === testId);
      if (currentTestState && currentTestState.status === 'active') {
        setTestHasStarted(true);
        setTestDetails(currentTestState); // Update local test details
        clearInterval(interval);
      }
      // Update participants list while waiting
      setParticipants(mockWaitingRoomParticipants[testId] || []);
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [testId, testDetails, testHasStarted]);


  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  if (!studentData || !testDetails) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        Loading waiting room...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {!testHasStarted ? (
                 <Hourglass className="h-12 w-12 text-primary animate-spin" />
            ) : (
                 <PlayCircle className="h-12 w-12 text-green-500" />
            )}
          </div>
          <CardTitle className="text-3xl font-headline">{testDetails.title}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {!testHasStarted ? "Waiting Room - The test will begin shortly." : "Test In Progress!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!testHasStarted ? (
            <>
              <div className="p-4 border bg-muted/50 rounded-lg text-center">
                <p className="text-foreground">Please wait for the teacher, {mockTeacher.name}, to start the test.</p>
                <p className="text-sm text-muted-foreground mt-1">Ensure you have a stable internet connection.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center">
                  <Users className="mr-2 h-6 w-6 text-primary" />
                  Participants ({participants.length})
                </h3>
                <ScrollArea className="h-48 rounded-md border p-3">
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
                          {participant.studentId === studentData.id && <Badge variant="secondary">You</Badge>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">You are the first one here!</p>
                  )}
                </ScrollArea>
              </div>
            </>
          ) : (
             <div className="p-6 border bg-green-500/10 rounded-lg text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3"/>
                <p className="text-xl text-green-700 font-semibold">The test has started!</p>
                <p className="text-muted-foreground mt-2">
                    The actual test-taking interface will be implemented in a future update.
                    For now, you would be redirected to the test questions.
                </p>
                <Button 
                    onClick={() => router.push(`/student/tests/${testId}/results`)} 
                    className="mt-4"
                    variant="outline"
                >
                    Go to Mock Results Page
                </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            {!testHasStarted ? "Back to Dashboard (Test will remain joinable)" : "Back to Dashboard"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    
