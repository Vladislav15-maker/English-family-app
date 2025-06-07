"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockUnitTests } from '@/lib/mock-data'; 
import { getUnitById } from '@/lib/course-data';
import type { UnitTest } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Play, Square, Edit, Trash2, Eye, ListChecks, Users, Hourglass } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function TeacherTestsPage() {
  const { teacherData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [tests, setTests] = useState<UnitTest[]>([]);

  useEffect(() => {
    // Load tests from mock data. Copy to allow local state modification.
    // Since mockUnitTests is now 'let', this component will re-render if mockUnitTests is changed elsewhere (e.g., on create page)
    // For a more robust solution, a global state manager (Context/Zustand/Redux) would be better.
    setTests([...mockUnitTests]); 
  }, []); // Re-fetch or listen to changes if mockUnitTests was a global state

   // This effect ensures the component re-renders if mockUnitTests is updated from another page
  useEffect(() => {
    const interval = setInterval(() => {
      if (tests.length !== mockUnitTests.length || !tests.every((t, i) => t.id === mockUnitTests[i]?.id && t.status === mockUnitTests[i]?.status)) {
        setTests([...mockUnitTests]);
      }
    }, 1000); // Check every second for simplicity
    return () => clearInterval(interval);
  }, [tests]);


  if (!teacherData) {
    return <div className="text-center p-8">Loading teacher data...</div>;
  }

  const handleOpenWaitingRoom = (testId: string) => {
    const testIndex = mockUnitTests.findIndex(t => t.id === testId);
    if (testIndex > -1 && mockUnitTests[testIndex].status === 'pending') {
      mockUnitTests[testIndex].status = 'waiting_room_open';
      setTests([...mockUnitTests]);
      toast({ title: "Waiting Room Opened", description: `Waiting room for "${mockUnitTests[testIndex].title}" is now open.` });
      router.push(`/teacher/tests/${testId}/waiting`);
    } else {
      toast({ title: "Error", description: "Could not open waiting room. Test might not be pending.", variant: "destructive" });
    }
  };

  const handleEndTest = (testId: string) => {
    const testIndex = mockUnitTests.findIndex(t => t.id === testId);
    if (testIndex > -1 && (mockUnitTests[testIndex].status === 'active' || mockUnitTests[testIndex].status === 'waiting_room_open')) {
      mockUnitTests[testIndex].status = 'completed';
      mockUnitTests[testIndex].endTime = new Date();
      setTests([...mockUnitTests]);
      toast({ title: "Test Ended", description: `Test "${mockUnitTests[testIndex].title}" has been marked as completed.` });
    } else {
      toast({ title: "Error", description: "Test could not be ended.", variant: "destructive" });
    }
  };
  
  const getStatusBadgeVariant = (status: UnitTest['status']) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'waiting_room_open': return 'default'; // Use primary color for open waiting room
      case 'active': return 'secondary';
      case 'completed': return 'destructive'; // Use destructive to indicate it's over
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
            <ListChecks className="h-8 w-8 text-primary" />
            <div>
                <h1 className="text-3xl font-headline text-foreground">Manage Tests</h1>
                <p className="text-muted-foreground">Oversee, create, and manage unit tests for your students.</p>
            </div>
        </div>
        <Link href="/teacher/tests/create" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Test
          </Button>
        </Link>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Test Overview</CardTitle>
          <CardDescription>List of all configured tests. Open waiting rooms for pending tests or end active ones.</CardDescription>
        </CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No tests created yet. <Link href="/teacher/tests/create" className="text-primary hover:underline">Create one now!</Link></p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => {
                  const unit = getUnitById(test.unitId);
                  return (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">{test.title}</TableCell>
                      <TableCell>{unit?.title || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(test.status)} className="capitalize">{test.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>{test.durationMinutes} min</TableCell>
                      <TableCell>{test.assignedDate ? format(new Date(test.assignedDate), 'PP') : 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {test.status === 'pending' && (
                          <Button variant="outline" size="sm" onClick={() => handleOpenWaitingRoom(test.id)} title="Open Waiting Room">
                            <Hourglass className="h-4 w-4 mr-1" /> Open Waiting
                          </Button>
                        )}
                         {test.status === 'waiting_room_open' && (
                          <>
                            <Button variant="default" size="sm" onClick={() => router.push(`/teacher/tests/${test.id}/waiting`)} title="Go to Waiting Room">
                                <Users className="h-4 w-4 mr-1" /> Go to Waiting
                            </Button>
                             <Button variant="outline" size="sm" onClick={() => handleEndTest(test.id)} title="End Test (Cancel Waiting Room)">
                                <Square className="h-4 w-4 mr-1" /> End
                            </Button>
                          </>
                        )}
                        {test.status === 'active' && (
                          <Button variant="destructive" size="sm" onClick={() => handleEndTest(test.id)} title="End Test">
                            <Square className="h-4 w-4 mr-1" /> End Test
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => alert('View results functionality coming soon!')} title="View Results/Submissions">
                          <Eye className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="sm" onClick={() => alert('Edit test functionality coming soon!')} title="Edit Test (only for pending tests)">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => alert(`Delete test '${test.title}' functionality coming soon!`)} title="Delete Test">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
