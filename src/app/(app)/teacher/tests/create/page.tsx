"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mockUnitTests, mockTeacher } from '@/lib/mock-data';
import { courseUnits, getUnitById } from '@/lib/course-data';
import type { UnitTest, Word as WordType, GrammarQuestion as GrammarQuestionType } from '@/types'; // Renamed to avoid conflict
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreateTestPage() {
  const { teacherData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [unitId, setUnitId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  // For simplicity, questions are auto-populated based on unit selection later.
  // A real implementation would need a more complex question selection UI.

  if (!teacherData) {
    return <div className="text-center p-8">Loading teacher data...</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !unitId || durationMinutes <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields correctly. Duration must be positive.",
        variant: "destructive",
      });
      return;
    }

    const selectedUnit = getUnitById(unitId);
    if (!selectedUnit) {
      toast({ title: "Error", description: "Selected unit not found.", variant: "destructive" });
      return;
    }

    // Auto-populate questions from first vocab and first grammar round of the selected unit
    const questions: (WordType | GrammarQuestionType)[] = [];
    if (selectedUnit.vocabulary.length > 0 && selectedUnit.vocabulary[0].words.length > 0) {
      questions.push(...selectedUnit.vocabulary[0].words);
    }
    if (selectedUnit.grammar.length > 0 && selectedUnit.grammar[0].questions.length > 0) {
      questions.push(...selectedUnit.grammar[0].questions);
    }

    if (questions.length === 0) {
        toast({
            title: "Warning",
            description: "Selected unit has no vocabulary or grammar in the first rounds to auto-populate questions. Test created with 0 questions.",
            variant: "default", // Or destructive if 0 questions is not allowed
        });
    }


    const newTest: UnitTest = {
      id: `test-${Date.now()}`,
      unitId,
      title,
      teacherId: teacherData.id,
      status: 'pending',
      durationMinutes,
      questions,
      assignedDate: new Date(),
    };

    mockUnitTests.push(newTest);
    toast({ title: "Test Created!", description: `"${title}" has been added to the test list.` });
    router.push('/teacher/tests');
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tests
      </Button>
      
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <PlusCircle className="mr-3 h-7 w-7 text-primary" /> Create New Unit Test
          </CardTitle>
          <CardDescription>
            Define the details for a new test. Questions will be auto-populated from the selected unit's first rounds.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="testTitle">Test Title</Label>
              <Input
                id="testTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Unit 1 Vocabulary & Grammar Review"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitId">Associated Unit</Label>
              <Select onValueChange={setUnitId} value={unitId} required>
                <SelectTrigger id="unitId">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {courseUnits.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.title} - {unit.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                min="1"
                required
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
                Note: Test questions will be automatically populated from the first vocabulary round and first grammar round of the selected unit. A full question editor will be available in a future update.
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full md:w-auto">
              Create Test
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}