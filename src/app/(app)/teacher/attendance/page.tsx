"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { mockStudents, mockStudentAttendance } from '@/lib/mock-data';
import type { StudentAttendance, AttendanceStatus } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Minus, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export default function TeacherAttendancePage() {
  const { teacherData } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>(mockStudentAttendance);
  const [currentMonthDates, setCurrentMonthDates] = useState<Date[]>([]);

  useEffect(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    setCurrentMonthDates(eachDayOfInterval({ start, end }));
  }, [selectedDate]);


  if (!teacherData) {
    return <div className="text-center p-8">Loading teacher data...</div>;
  }

  const handleAttendanceChange = (studentId: string, date: Date, status: AttendanceStatus) => {
    const dateString = format(date, 'yyyy-MM-dd');
    setAttendanceData(prevData =>
      prevData.map(studentAtt => {
        if (studentAtt.studentId === studentId) {
          const newAttendance = { ...studentAtt.attendance, [dateString]: status };
          return { ...studentAtt, attendance: newAttendance };
        }
        return studentAtt;
      })
    );
    // Here you would typically save this to a backend
    console.log(`Attendance updated for ${studentId} on ${dateString} to ${status}`);
  };

  const getAttendanceIcon = (status: AttendanceStatus) => {
    if (status === 'present') return <Check className="h-5 w-5 text-green-500" />;
    if (status === 'absent') return <X className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-gray-400" />;
  };
  
  const cycleAttendanceStatus = (currentStatus: AttendanceStatus): AttendanceStatus => {
    if (currentStatus === null) return 'present';
    if (currentStatus === 'present') return 'absent';
    if (currentStatus === 'absent') return null;
    return null;
  };


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-foreground">Student Attendance</CardTitle>
          <CardDescription>Mark attendance for your students. Click on circles to toggle status (Present / Absent / Not Marked).</CardDescription>
          <div className="flex items-center space-x-4 mt-4">
            <Button variant="outline" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>Previous Day</Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>Next Day</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Student</TableHead>
                  {currentMonthDates.slice(0,7).map(date => ( // Show first 7 days of month for brevity
                     <TableHead key={date.toString()} className="text-center w-12 p-1">
                        <div className={`flex flex-col items-center ${format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 'bg-primary/20 rounded-md p-1' : ''}`}>
                           <span className="text-xs">{format(date, 'EEE')}</span>
                           <span className="font-bold">{format(date, 'd')}</span>
                        </div>
                     </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.map((studentAtt) => (
                  <TableRow key={studentAtt.studentId}>
                    <TableCell className="font-medium">{studentAtt.name}</TableCell>
                    {currentMonthDates.slice(0,7).map(date => {
                       const dateString = format(date, 'yyyy-MM-dd');
                       const status = studentAtt.attendance[dateString] || null;
                       return (
                          <TableCell key={date.toString()} className="text-center p-1">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-full w-8 h-8 hover:bg-muted-foreground/20"
                                onClick={() => handleAttendanceChange(studentAtt.studentId, date, cycleAttendanceStatus(status))}
                                title={`Mark ${studentAtt.name} for ${format(date, 'PPP')}`}
                              >
                               {getAttendanceIcon(status)}
                             </Button>
                          </TableCell>
                       );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           <p className="text-xs text-muted-foreground mt-4">Showing first 7 days of {format(selectedDate, 'MMMM yyyy')}. Full month view can be implemented with horizontal scroll.</p>
        </CardContent>
      </Card>
    </div>
  );
}
