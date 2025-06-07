
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mockUnitTests, mockStudents, mockWaitingRoomParticipants, mockTeacher } from '@/lib/mock-data';
import type { UnitTest as UnitTestType, Student } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users, CheckCircle, Hourglass } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge'; // Added import

export default function TestWaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { studentData } = useAuth();
  const testId = params.testId as string;

  const [testDetails, setTestDetails] = useState<UnitTestType | null>(null);
  const [participants, setParticipants] = useState<{ studentId: string; studentName: string; avatarFallback: string }[]>([]);

  useEffect(() => {
    const foundTest = mockUnitTests.find(t => t.id === testId);
    if (foundTest) {
      setTestDetails(foundTest);
      // Simulate fetching participants. Add current student if they are in mockStudents list.
      let currentParticipants = mockWaitingRoomParticipants[testId] || [];
      if (studentData && !currentParticipants.find(p => p.studentId === studentData.id)) {
        const currentUserMock = mockStudents.find(s => s.id === studentData.id);
        if (currentUserMock) {
            const names = currentUserMock.name.split(' ');
            const fallback = names.length > 1 ? `${names[0][0]}${names[names.length-1][0]}` : names[0].substring(0,2);
            currentParticipants = [...currentParticipants, { studentId: studentData.id, studentName: studentData.name, avatarFallback: fallback.toUpperCase() }];
        }
      }
      setParticipants(currentParticipants);
    } else {
      // Handle test not found, maybe redirect or show error
      router.replace('/student/dashboard'); // Or a 404 page
    }
  }, [testId, studentData, router]);

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
            <Hourglass className="h-12 w-12 text-primary animate-spin" />
          </div>
          <CardTitle className="text-3xl font-headline">{testDetails.title}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Waiting Room - The test will begin shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border bg-muted/50 rounded-lg text-center">
            <p className="text-foreground">Please wait for the teacher to start the test for all participants.</p>
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
                <p className="text-muted-foreground text-center py-4">No other participants yet.</p>
              )}
            </ScrollArea>
          </div>
          
          <div className="text-center mt-6">
             <p className="text-sm text-muted-foreground">Your teacher, {mockTeacher.name}, will start the test soon.</p>
          </div>

        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard (Test will remain active)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    
