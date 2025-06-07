"use client";

import { useAuth } from '@/context/AuthContext';
import { courseUnits } from '@/lib/course-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, PlusCircle, Eye, Lock } from 'lucide-react';
import type { Unit } from '@/types';

// Helper to calculate unlock status dynamically
const isUnitEffectivelyLocked = (unit: Unit): boolean => {
  if (unit.unlockDate) {
    const now = new Date();
    const unlockTime = new Date(unit.unlockDate);
    unlockTime.setHours(18, 0, 0, 0); // Consistent with student unlock logic
    return now < unlockTime;
  }
  return unit.isLocked; 
};


export default function TeacherUnitsPage() {
  const { teacherData } = useAuth();

  if (!teacherData) {
    return <div className="text-center p-8">Loading teacher data...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-headline text-foreground">Course Units</h1>
            <p className="text-muted-foreground">Manage and organize learning materials.</p>
        </div>
        <Button onClick={() => alert('Add new unit functionality will be available soon!')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Unit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courseUnits.map((unit) => {
          const isLocked = isUnitEffectivelyLocked(unit);
          return (
            <Card key={unit.id} className={`overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col ${isLocked ? 'bg-muted/30' : ''}`}>
              <CardHeader className="relative p-0">
                <Image
                  src={`https://placehold.co/600x400.png?bg=${isLocked ? 'A9A9A9' : '99CC99'}&text=${encodeURIComponent(unit.title)}`}
                  alt={unit.title}
                  width={600}
                  height={400}
                  className={`w-full h-48 object-cover ${isLocked ? 'opacity-60' : ''}`}
                  data-ai-hint={unit.imagePlaceholder || "education syllabus"}
                />
                {isLocked && <Lock className="absolute top-3 right-3 h-6 w-6 text-background bg-foreground/50 rounded-full p-1" />}
              </CardHeader>
              <CardContent className="pt-4 flex-grow">
                <CardTitle className={`font-headline text-xl mb-1 ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>{unit.title}</CardTitle>
                <CardDescription className={`text-sm mb-2 ${isLocked ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>{unit.description}</CardDescription>
                <p className="text-xs text-muted-foreground">
                  {unit.vocabulary.length} Vocab Rounds, {unit.grammar.length} Grammar Rounds
                </p>
                <p className={`text-xs font-medium ${isLocked ? 'text-orange-600 dark:text-orange-500' : 'text-green-600 dark:text-green-500'}`}>
                  Status: {isLocked ? 'Locked' : 'Unlocked'}
                  {isLocked && unit.unlockDate && (
                    <span className="text-xs text-muted-foreground/90 block"> (Unlocks: {new Date(unit.unlockDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})</span>
                  )}
                </p>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/teacher/units/${unit.id}/view`}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => alert(`Editing unit '${unit.title}' functionality will be available soon!`)}>
                      <Edit className="mr-1 h-4 w-4" /> Edit
                  </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
