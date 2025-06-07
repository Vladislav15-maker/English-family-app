"use client";

import { useAuth } from '@/context/AuthContext';
import { courseUnits } from '@/lib/course-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, PlusCircle, Trash2, Eye } from 'lucide-react';

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
        <Button onClick={() => alert('Add new unit functionality coming soon!')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Unit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courseUnits.map((unit) => (
          <Card key={unit.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader className="relative p-0">
              <Image
                src={`https://placehold.co/600x400.png?text=${encodeURIComponent(unit.title)}&bg=99CC99`} // Using border color for teacher view
                alt={unit.title}
                width={600}
                height={400}
                className="w-full h-48 object-cover"
                data-ai-hint={unit.imagePlaceholder || "education syllabus"}
              />
            </CardHeader>
            <CardContent className="pt-4 flex-grow">
              <CardTitle className="font-headline text-xl mb-1 text-foreground">{unit.title}</CardTitle>
              <CardDescription className="text-muted-foreground mb-2">{unit.description}</CardDescription>
              <p className="text-sm text-muted-foreground">
                {unit.vocabulary.length} Vocab Rounds, {unit.grammar.length} Grammar Rounds
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {unit.isLocked ? 'Locked' : 'Unlocked'}
              </p>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => alert(`Viewing ${unit.title}`)}>
                    <Eye className="mr-1 h-4 w-4" /> View
                </Button>
                <Button variant="outline" size="sm" onClick={() => alert(`Editing ${unit.title}`)}>
                    <Edit className="mr-1 h-4 w-4" /> Edit
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
