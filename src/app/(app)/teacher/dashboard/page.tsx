"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, BookOpenText, CalendarCheck, BarChart, MessageSquarePlus, PlusCircle } from 'lucide-react';
import { mockStudents } from '@/lib/mock-data'; // Assuming you have this with student info
import { getOverallStudentProgress, StudentProgressSummary } from '@/lib/progress-utils';
import { useEffect, useState } from 'react';

interface AggregatedProgress {
  averageCompletion: number;
  activeStudents: number;
  testsConducted: number; // Mock this for now
}

export default function TeacherDashboardPage() {
  const { teacherData } = useAuth();
  const [aggregatedProgress, setAggregatedProgress] = useState<AggregatedProgress | null>(null);

  useEffect(() => {
    if (teacherData) {
      let totalCompletion = 0;
      let studentsWithProgress = 0;
      mockStudents.forEach(student => {
        const summary = getOverallStudentProgress(student.id);
        if (summary.overallAverageCompletion > 0) {
          totalCompletion += summary.overallAverageCompletion;
          studentsWithProgress++;
        }
      });
      setAggregatedProgress({
        averageCompletion: studentsWithProgress > 0 ? totalCompletion / studentsWithProgress : 0,
        activeStudents: mockStudents.length, // Or count students with recent activity
        testsConducted: 5, // Mock value
      });
    }
  }, [teacherData]);

  if (!teacherData) {
    return <div className="text-center p-8">Loading teacher data...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-headline mb-8 text-foreground">Welcome, {teacherData.name}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><Users className="text-primary"/> Students Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{aggregatedProgress?.activeStudents ?? 0}</p>
            <p className="text-sm text-muted-foreground">students enrolled</p>
            <Link href="/teacher/students"><Button variant="link" className="p-0 h-auto mt-1">Manage Students</Button></Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><BarChart className="text-accent"/> Class Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-accent">{aggregatedProgress?.averageCompletion.toFixed(0) ?? 0}%</p>
            <p className="text-sm text-muted-foreground">average completion</p>
             <Link href="/teacher/students"><Button variant="link" className="p-0 h-auto mt-1">View Details</Button></Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><BookOpenText className="text-secondary-foreground"/> Tests Conducted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-secondary-foreground">{aggregatedProgress?.testsConducted ?? 0}</p>
            <p className="text-sm text-muted-foreground">unit tests completed</p>
             <Link href="/teacher/tests"><Button variant="link" className="p-0 h-auto mt-1">Manage Tests</Button></Link>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-headline mb-6 text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/teacher/students" passHref>
          <Button variant="outline" className="w-full h-20 text-lg justify-start p-4 shadow-md hover:bg-accent/10">
            <Users className="mr-3 h-6 w-6 text-primary" /> View Students
          </Button>
        </Link>
        <Link href="/teacher/units" passHref>
          <Button variant="outline" className="w-full h-20 text-lg justify-start p-4 shadow-md hover:bg-accent/10">
            <BookOpenText className="mr-3 h-6 w-6 text-primary" /> Manage Units
          </Button>
        </Link>
        <Link href="/teacher/attendance" passHref>
          <Button variant="outline" className="w-full h-20 text-lg justify-start p-4 shadow-md hover:bg-accent/10">
            <CalendarCheck className="mr-3 h-6 w-6 text-primary" /> Mark Attendance
          </Button>
        </Link>
        <Link href="/teacher/tests/create" passHref>
           <Button variant="outline" className="w-full h-20 text-lg justify-start p-4 shadow-md hover:bg-accent/10">
            <PlusCircle className="mr-3 h-6 w-6 text-primary" /> Create Test
          </Button>
        </Link>
        <Link href="/messages?compose=true" passHref>
            <Button variant="outline" className="w-full h-20 text-lg justify-start p-4 shadow-md hover:bg-accent/10">
                <MessageSquarePlus className="mr-3 h-6 w-6 text-primary" /> Send Message
            </Button>
        </Link>
      </div>

      {/* Placeholder for recent activity or important notifications */}
      <Card className="mt-10 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Recent Activity</CardTitle>
          <CardDescription>Overview of recent student submissions or system notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="text-sm text-muted-foreground">No new activity to display.</li>
            {/* Example: <li className="text-sm">Oksana completed Unit 1 Grammar Round 2.</li> */}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
