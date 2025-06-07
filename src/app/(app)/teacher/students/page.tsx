"use client";

import { useAuth } from '@/context/AuthContext';
import { mockStudents } from '@/lib/mock-data';
import { courseUnits } from '@/lib/course-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PlusCircle, Edit3, Eye } from 'lucide-react';
import { getStudentProgressForUnit, getOverallStudentProgress } from '@/lib/progress-utils'; 
import { Progress } from '@/components/ui/progress'; 

export default function TeacherStudentsPage() {
  const { teacherData } = useAuth();

  if (!teacherData) {
    return <div className="text-center p-8">Loading teacher data...</div>;
  }
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-headline text-foreground">Manage Students</h1>
            <p className="text-muted-foreground">View student progress and manage class details.</p>
        </div>
        <Button onClick={() => alert('Add new student functionality will be available soon!')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Student
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Student List & Progress</CardTitle>
          <CardDescription>
            Track homework completion for each student across all units. 
            Progress indicators show overall unit completion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Student</TableHead>
                  <TableHead className="text-center w-[150px]">Overall Progress</TableHead>
                  {courseUnits.slice(0, 5).map(unit => ( 
                    <TableHead key={unit.id} className="text-center w-[100px]">{unit.title}</TableHead>
                  ))}
                  <TableHead className="text-right w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockStudents.map((student) => {
                  const overallProgressSummary = getOverallStudentProgress(student.id);
                  const overallProgressValue = overallProgressSummary.overallAverageCompletion;

                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                                {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           <Progress value={overallProgressValue} className="w-24 h-2 mb-1" aria-label={`Overall progress ${overallProgressValue.toFixed(0)}%`} />
                           <span className="text-xs text-muted-foreground">{overallProgressValue.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      {courseUnits.slice(0, 5).map(unit => {
                        const unitProgress = getStudentProgressForUnit(student.id, unit.id);
                        const completion = unitProgress?.overallCompletion ?? 0;
                        const progressColor = completion >= 80 ? 'bg-primary' : completion > 0 ? 'bg-orange-400' : 'bg-muted';
                        
                        return (
                          <TableCell key={unit.id} className="text-center">
                            <Link href={`/teacher/students/${student.id}/progress/${unit.id}`} title={`View ${student.name}'s progress for ${unit.title}`}>
                              <div className="flex flex-col items-center cursor-pointer group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white ${progressColor} group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-ring transition-all`}>
                                  {completion.toFixed(0)}%
                                </div>
                              </div>
                            </Link>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                           <Link href={`/teacher/students/${student.id}/details`} title={`View details for ${student.name}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => alert(`Editing ${student.name} - coming soon!`)} title={`Edit ${student.name}`}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
           <p className="text-xs text-muted-foreground mt-2">Showing first {courseUnits.slice(0,5).length} units. Full unit list can be seen on student detail page.</p>
        </CardContent>
      </Card>
    </div>
  );
}