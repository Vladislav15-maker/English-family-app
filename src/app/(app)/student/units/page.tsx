"use client";

import { useAuth } from '@/context/AuthContext';
import { courseUnits } from '@/lib/course-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { getStudentProgressForUnit } from '@/lib/progress-utils';
import type { Unit } from '@/types';

// Helper to calculate unlock status (can be expanded)
const isUnitEffectivelyLocked = (unit: Unit): boolean => {
  if (unit.unlockDate) {
    const now = new Date();
    const unlockTime = new Date(unit.unlockDate);
    unlockTime.setHours(18, 0, 0, 0); // Unlock at 6 PM on the specified date
    return now < unlockTime;
  }
  return unit.isLocked; // Fallback to the static flag
};


export default function StudentUnitsPage() {
  const { studentData } = useAuth();

  if (!studentData) {
    return <div className="text-center p-8">Loading student data...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-headline mb-2 text-foreground">My Learning Units</h1>
      <p className="text-muted-foreground mb-8">Track your progress and continue your English journey.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courseUnits.map((unit) => {
          const isLocked = isUnitEffectivelyLocked(unit);
          const unitProgress = getStudentProgressForUnit(studentData.id, unit.id);
          const isCompleted = unitProgress && unitProgress.overallCompletion >= 100;
          const progressPercent = unitProgress?.overallCompletion.toFixed(0) ?? 0;

          return (
            <Card key={unit.id} className={`overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col ${isLocked ? 'bg-muted/30' : ''}`}>
              <CardHeader className="relative p-0">
                <Image
                  src={`https://placehold.co/600x400.png?bg=${isLocked ? 'A9A9A9' : (isCompleted ? '40BF40' : 'B8D8B8')}&text=${encodeURIComponent(unit.title)}`}
                  alt={unit.title}
                  width={600}
                  height={400}
                  className={`w-full h-48 object-cover ${isLocked ? 'opacity-50' : ''}`}
                  data-ai-hint={unit.imagePlaceholder || "education learning"}
                />
                {isLocked && <Lock className="absolute top-3 right-3 h-7 w-7 text-background bg-foreground/50 rounded-full p-1.5" />}
                {!isLocked && isCompleted && <CheckCircle className="absolute top-3 right-3 h-7 w-7 text-background bg-primary rounded-full p-1" />}
              </CardHeader>
              <CardContent className="pt-4 flex-grow">
                <CardTitle className={`font-headline text-xl mb-1 ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>{unit.title}</CardTitle>
                <CardDescription className={`mb-2 ${isLocked ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>{unit.description}</CardDescription>
                {!isLocked && (
                  <>
                    <div className="w-full bg-muted rounded-full h-2.5 mb-1">
                      <div 
                        className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{progressPercent}% Complete</p>
                  </>
                )}
              </CardContent>
              <CardFooter>
                {isLocked ? (
                  <Button className="w-full" variant="outline" disabled>
                    <Lock className="mr-2 h-4 w-4" /> Locked
                  </Button>
                ) : (
                  <Link href={`/student/units/${unit.id}`} passHref className="w-full">
                    <Button className="w-full" variant={isCompleted ? "secondary" : "default"}>
                      {isCompleted ? 'Review Unit' : 'Start Learning'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
