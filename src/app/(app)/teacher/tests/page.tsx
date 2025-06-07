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
import { PlusCircle, Edit, Trash2, Eye, ListChecks, Users, Hourglass, PlayCircle, PowerOff, Send } from 'lucide-react'; // Added Send icon
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';

// Sub-component for the Delete Test Dialog
function DeleteTestDialog({ test, onDelete }: { test: UnitTest; onDelete: (testId: string) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Delete Test" disabled={test.status === 'active'}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the test
            "{test.title}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDelete(test.id)} className="bg-destructive hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default function TeacherTestsPage() {
  const { teacherData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [tests, setTests] = useState<UnitTest[]>([]);

  useEffect(() => {
    setTests([...mockUnitTests]); 
    console.log('[TeacherTestsPage] Initializing tests state:', JSON.parse(JSON.stringify(mockUnitTests.map(t => ({id: t.id, status: t.status, title:t.title})))));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentMockSnapshot = [...mockUnitTests];
      
      if (tests.length !== currentMockSnapshot.length || 
          !tests.every((t, i) => t.id === currentMockSnapshot[i]?.id && t.status === currentMockSnapshot[i]?.status)
      ) {
        setTests(currentMockSnapshot);
      }
    }, 1000); 
    return () => {
        clearInterval(interval);
    }
  }, [tests]); 


  if (!teacherData) {
    return <div className="text-center p-8">Loading teacher data...</div>;
  }

  const handleMakeJoinable = (testId: string) => {
    const testIndex = mockUnitTests.findIndex(t => t.id === testId);
    if (testIndex > -1 && mockUnitTests[testIndex].status === 'pending') {
      mockUnitTests[testIndex].status = 'waiting_room_open';
      setTests([...mockUnitTests]); 
      console.log('[TeacherTestsPage] mockUnitTests after making test joinable:', JSON.parse(JSON.stringify(mockUnitTests.map(t => ({id: t.id, title: t.title, status: t.status})))));
      toast({ title: "Test Is Joinable", description: `Waiting room for "${mockUnitTests[testIndex].title}" is now open. Students can join.` });
      router.push(`/teacher/tests/${testId}/waiting`);
    } else {
      toast({ title: "Error", description: "Could not open waiting room. Test might not be pending or already open/active.", variant: "destructive" });
    }
  };

  const handleEndTest = (testId: string) => {
    const testIndex = mockUnitTests.findIndex(t => t.id === testId);
    if (testIndex > -1 && (mockUnitTests[testIndex].status === 'active' || mockUnitTests[testIndex].status === 'waiting_room_open')) {
      const oldStatus = mockUnitTests[testIndex].status;
      mockUnitTests[testIndex].status = 'completed';
      mockUnitTests[testIndex].endTime = new Date();
      setTests([...mockUnitTests]); 
      console.log('[TeacherTestsPage] mockUnitTests after ending test:', JSON.parse(JSON.stringify(mockUnitTests.map(t => ({id: t.id, title: t.title, status: t.status})))));
      toast({ title: "Test Ended", description: `Test "${mockUnitTests[testIndex].title}" (was ${oldStatus}) has been marked as completed.` });
    } else {
      toast({ title: "Error", description: "Test could not be ended. It might not be active or in waiting room.", variant: "destructive" });
    }
  };

  const confirmDeleteTest = (testIdToDelete: string) => {
    const testIndex = mockUnitTests.findIndex(t => t.id === testIdToDelete);
    if (testIndex > -1) {
      const deletedTestTitle = mockUnitTests[testIndex].title;
      mockUnitTests.splice(testIndex, 1);
      setTests([...mockUnitTests]); 
      console.log('[TeacherTestsPage] mockUnitTests after deleting test:', JSON.parse(JSON.stringify(mockUnitTests.map(t => ({id: t.id, title: t.title, status: t.status})))));
      toast({ title: "Test Deleted", description: `Test "${deletedTestTitle}" has been deleted.`, variant: "destructive" });
    } else {
      toast({ title: "Error", description: "Test not found for deletion.", variant: "destructive" });
    }
  };
  
  const getStatusBadgeVariant = (status: UnitTest['status']) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'waiting_room_open': return 'default'; 
      case 'active': return 'secondary'; 
      case 'completed': return 'destructive'; 
      default: return 'outline';
    }
  };

  return (
    <>
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
            <CardDescription>List of all configured tests. Make tests joinable, or end active/waiting ones.</CardDescription>
          </CardHeader>
          <CardContent>
            {tests.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No tests created yet. <Link href="/teacher/tests/create" className="text-primary hover:underline">Create one now!</Link></p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Questions</TableHead>
                    <TableHead className="text-center">Duration</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right min-w-[280px]">Actions</TableHead>
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
                          <Badge variant={getStatusBadgeVariant(test.status)} className="capitalize whitespace-nowrap">{test.status.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{test.questions.length}</TableCell>
                        <TableCell className="text-center">{test.durationMinutes} min</TableCell>
                        <TableCell>{test.assignedDate ? format(new Date(test.assignedDate), 'PP') : 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {test.status === 'pending' && (
                            <Button variant="outline" size="sm" onClick={() => handleMakeJoinable(test.id)} title="Make test joinable and open waiting room">
                              <Send className="h-4 w-4 mr-1" /> Make Joinable
                            </Button>
                          )}
                          {test.status === 'waiting_room_open' && (
                            <>
                              <Button variant="default" size="sm" onClick={() => router.push(`/teacher/tests/${test.id}/waiting`)} title="Go to Waiting Room">
                                  <Users className="h-4 w-4 mr-1" /> Go to Waiting
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEndTest(test.id)} title="End Test &amp; Close Waiting Room" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                                  <PowerOff className="h-4 w-4 mr-1" /> End Test
                              </Button>
                            </>
                          )}
                          {test.status === 'active' && (
                            <Button variant="destructive" size="sm" onClick={() => handleEndTest(test.id)} title="End Active Test">
                              <PowerOff className="h-4 w-4 mr-1" /> End Test
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => router.push(`/teacher/tests/${test.id}/results`)} title="View Results (Coming Soon)">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => router.push(`/teacher/tests/${test.id}/edit`)} title="Edit Test (Coming Soon for pending tests)" disabled={test.status !== 'pending'}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteTestDialog test={test} onDelete={confirmDeleteTest} />
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
    </>
  );
}


