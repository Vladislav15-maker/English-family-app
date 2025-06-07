
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart3, User, BookOpen, HelpCircle, Users, CheckSquare, Percent } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockStudents, mockUnitTests } from '@/lib/mock-data';
import { getOverallStudentProgress, type StudentProgressSummary } from '@/lib/progress-utils';
import { courseUnits } from '@/lib/course-data';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";


// Mock data for charts
const studentProgressOverTimeData = [
  { month: "Jan", progress: 20 }, { month: "Feb", progress: 35 },
  { month: "Mar", progress: 50 }, { month: "Apr", progress: 65 },
  { month: "May", progress: 75 },
];
const studentProgressChartConfig = {
  progress: { label: "Progress", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const studentActivityData = [
  { activity: "Logins", count: 30, fill: "hsl(var(--chart-1))" },
  { activity: "Units Started", count: 5, fill: "hsl(var(--chart-2))" },
  { activity: "Rounds Completed", count: 25, fill: "hsl(var(--chart-3))" },
  { activity: "Hints Used", count: 3, fill: "hsl(var(--chart-4))" },
];


const teacherClassDistributionData = [
  { name: '0-20%', students: 2, fill: "hsl(var(--chart-5))" },
  { name: '21-40%', students: 1, fill: "hsl(var(--chart-4))" },
  { name: '41-60%', students: 3, fill: "hsl(var(--chart-3))" },
  { name: '61-80%', students: 5, fill: "hsl(var(--chart-2))" },
  { name: '81-100%', students: mockStudents.length - 11 < 0 ? 0 : mockStudents.length - 11, fill: "hsl(var(--chart-1))" }, // ensure positive
];


interface TeacherStats {
  averageClassCompletion: number;
  totalStudents: number;
  testsConducted: number;
  studentSummaries: (StudentProgressSummary & { studentId: string; studentName: string })[];
}

export default function StatisticsPage() {
  const { user, studentData, teacherData, isLoading } = useAuth();
  const [studentProgress, setStudentProgress] = useState<StudentProgressSummary | null>(null);
  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(null);

  useEffect(() => {
    if (studentData) {
      setStudentProgress(getOverallStudentProgress(studentData.id));
    }
    if (teacherData) {
      const summaries = mockStudents.map(s => ({
        ...getOverallStudentProgress(s.id),
        studentId: s.id,
        studentName: s.name,
      }));
      const totalCompletion = summaries.reduce((acc, curr) => acc + curr.overallAverageCompletion, 0);
      setTeacherStats({
        averageClassCompletion: mockStudents.length > 0 ? totalCompletion / mockStudents.length : 0,
        totalStudents: mockStudents.length,
        testsConducted: mockUnitTests.filter(t => t.status === 'completed').length, // Example: count completed tests
        studentSummaries: summaries,
      });
    }
  }, [studentData, teacherData]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading statistics...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-foreground flex items-center">
            <BarChart3 className="mr-3 h-8 w-8 text-primary" />
            Statistics
          </CardTitle>
          <CardDescription>
            View {user?.role === 'student' ? 'your learning and performance statistics.' : 'class performance and student engagement.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.role === 'student' && studentData && studentProgress && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{studentProgress.overallAverageCompletion.toFixed(0)}%</div>
                    <Progress value={studentProgress.overallAverageCompletion} className="h-2 mt-2" />
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Units Completed</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{studentProgress.completedUnits} / {studentProgress.totalUnits}</div>
                    <p className="text-xs text-muted-foreground">units fully mastered</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Hints Remaining</CardTitle>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">{studentData.hintsRemaining}</div>
                    <p className="text-xs text-muted-foreground">available for use</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">Progress Over Time</CardTitle>
                    <CardDescription>Your unit completion trend.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={studentProgressChartConfig} className="min-h-[250px] w-full">
                      <BarChart accessibilityLayer data={studentProgressOverTimeData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} unit="%" />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="progress" fill="var(--color-progress)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">Activity Summary</CardTitle>
                     <CardDescription>Overview of your interactions.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <ChartContainer config={{}} className="min-h-[250px] w-full max-w-[300px] aspect-square">
                       <PieChart accessibilityLayer>
                        <ChartTooltip content={<ChartTooltipContent nameKey="activity" hideLabel />} />
                        <Pie data={studentActivityData} dataKey="count" nameKey="activity" cy="50%" cx="50%" outerRadius={100} label={({ name, count }) => `${name}: ${count}`}>
                           {studentActivityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {user?.role === 'teacher' && teacherData && teacherStats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Class Completion</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{teacherStats.averageClassCompletion.toFixed(0)}%</div>
                     <Progress value={teacherStats.averageClassCompletion} className="h-2 mt-2" />
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teacherStats.totalStudents}</div>
                     <p className="text-xs text-muted-foreground">enrolled in the course</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tests Conducted</CardTitle>
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">{teacherStats.testsConducted}</div>
                    <p className="text-xs text-muted-foreground">marked as completed</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Student Progress Overview</CardTitle>
                  <CardDescription>Summary of each student's performance.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="text-center">Overall Progress</TableHead>
                        <TableHead className="text-center">Units Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherStats.studentSummaries.map(summary => (
                        <TableRow key={summary.studentId}>
                          <TableCell className="font-medium">{summary.studentName}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                                <Progress value={summary.overallAverageCompletion} className="h-2 w-20" />
                                <span>{summary.overallAverageCompletion.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{summary.completedUnits} / {summary.totalUnits}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Class Performance Distribution</CardTitle>
                  <CardDescription>How students are distributed by progress ranges.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="min-h-[300px] w-full">
                    <BarChart accessibilityLayer data={teacherClassDistributionData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis dataKey="students" type="number" allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" hideLabel />} />
                      <Bar dataKey="students" radius={4}>
                        {teacherClassDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

            </div>
          )}
          {!user && !isLoading && (
            <p className="text-center text-muted-foreground">Please log in to view statistics.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

