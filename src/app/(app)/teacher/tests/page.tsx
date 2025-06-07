"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockUnitTests, mockTeacher } from '@/lib/mock-data'; // mockTeacher might be useful later
import { getUnitById } from '@/lib/course-data';
import type { UnitTest } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Play, Square, Edit, Trash2, Eye, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function TeacherTestsPage() {
  const { teacherData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [tests, setTests] = useState<UnitTest[]>([]);

  useEffect(() => {
    // Initialize tests from mock data. Important to copy to allow local state modification.
    setTests([...mockUnitTests]);
  }, []);

  if (!teacherData) {
    return <div className="text-center p-8">Loading teacher data...</div>;
  }

  const handleStartTest = (testId: string) => {
    const testIndex = mockUnitTests.findIndex(t => t.id === testId);
    if (testIndex > -1 && mockUnitTests[testIndex].status === 'pending') {
      mockUnitTests[testIndex].status = 'active';
      mockUnitTests[testIndex].startTime = new Date();
      mockUnitTests[testIndex].endTime = undefined; // Clear previous end time if any
      setTests([...mockUnitTests]); // Update local state to trigger re-render
      toast({ title: "Test Started", description: `Test "${mockUnitTests[testIndex].title}" is now active.` });
    } else {
      toast({ title: "Error", description: "Test could not be started. It might not be pending or not found.", variant: "destructive" });
    }
  };

  const handleEndTest = (testId: string) => {
    const testIndex = mockUnitTests.findIndex(t => t.id === testId);
    if (testIndex > -1 && mockUnitTests[testIndex].status === 'active') {
      mockUnitTests[testIndex].status = 'completed';
      mockUnitTests[testIndex].endTime = new Date();
      setTests([...mockUnitTests]);
      toast({ title: "Test Ended", description: `Test "${mockUnitTests[testIndex].title}" has been marked as completed.` });
    } else {
      toast({ title: "Error", description: "Test could not be ended. It might not be active or not found.", variant: "destructive" });
    }
  };
  
  const getStatusBadgeVariant = (status: UnitTest['status']) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'active': return 'secondary';
      case 'completed': return 'default';
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
          <CardDescription>List of all configured tests. Start pending tests or end active ones.</CardDescription>
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
                  <TableHead>Assigned</TableHead>
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
                        <Badge variant={getStatusBadgeVariant(test.status)} className="capitalize">{test.status}</Badge>
                      </TableCell>
                      <TableCell>{test.durationMinutes} min</TableCell>
                      <TableCell>{test.assignedDate ? format(new Date(test.assignedDate), 'PP') : 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {test.status === 'pending' && (
                          <Button variant="outline" size="sm" onClick={() => handleStartTest(test.id)} title="Start Test">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {test.status === 'active' && (
                          <Button variant="outline" size="sm" onClick={() => handleEndTest(test.id)} title="End Test">
                            <Square className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/teacher/tests/${test.id}/results`)} title="View Results/Submissions">
                          <Eye className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="sm" onClick={() => router.push(`/teacher/tests/${test.id}/edit`)} title="Edit Test">
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
