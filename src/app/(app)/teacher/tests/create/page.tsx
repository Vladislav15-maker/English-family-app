"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mockUnitTests } from '@/lib/mock-data';
import { courseUnits, getUnitById } from '@/lib/course-data';
import type { UnitTest, Word as WordType, GrammarQuestion as GrammarQuestionType, Unit } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, PlusCircle, BookOpenText, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreateTestPage() {
  const { teacherData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(undefined);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedQuestions, setSelectedQuestions] = useState<Record<string, boolean>>({}); // Store IDs of selected questions/words

  useEffect(() => {
    if (selectedUnitId) {
      const unit = getUnitById(selectedUnitId);
      setSelectedUnit(unit || null);
      setSelectedQuestions({}); // Reset selected questions when unit changes
    } else {
      setSelectedUnit(null);
      setSelectedQuestions({});
    }
  }, [selectedUnitId]);

  if (!teacherData) {
    return <div className="text-center p-8">Loading teacher data...</div>;
  }

  const handleQuestionSelection = (itemId: string) => {
    setSelectedQuestions(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedUnitId || !selectedUnit || durationMinutes <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in title, select a unit, and set a positive duration.",
        variant: "destructive",
      });
      return;
    }

    const questionsForTest: (WordType | GrammarQuestionType)[] = [];
    selectedUnit.vocabulary.forEach(vr => vr.words.forEach(word => {
      if (selectedQuestions[word.id]) questionsForTest.push(word);
    }));
    selectedUnit.grammar.forEach(gr => gr.questions.forEach(q => {
      if (selectedQuestions[q.id]) questionsForTest.push(q);
    }));

    if (questionsForTest.length === 0) {
      toast({
        title: "No Questions Selected",
        description: "Please select at least one word or grammar question for the test.",
        variant: "destructive",
      });
      return;
    }

    const newTest: UnitTest = {
      id: `test-${Date.now()}`,
      unitId: selectedUnitId,
      title,
      teacherId: teacherData.id,
      status: 'pending',
      durationMinutes,
      questions: questionsForTest,
      assignedDate: new Date(),
    };

    mockUnitTests.push(newTest);
    console.log('[CreateTestPage] mockUnitTests after push:', JSON.parse(JSON.stringify(mockUnitTests.map(t => ({id: t.id, title: t.title, status: t.status})))));
    toast({ title: "Test Created!", description: `"${title}" has been added. Status: Pending.` });
    router.push('/teacher/tests');
  };

  const countSelectedQuestions = () => Object.values(selectedQuestions).filter(Boolean).length;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tests
      </Button>
      
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <PlusCircle className="mr-3 h-7 w-7 text-primary" /> Create New Unit Test
          </CardTitle>
          <CardDescription>
            Define test details and select questions from the chosen unit.
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
              <Select onValueChange={setSelectedUnitId} value={selectedUnitId} required>
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

            {selectedUnit && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                <h3 className="text-lg font-semibold text-foreground">Select Questions for "{selectedUnit.title}"</h3>
                <p className="text-sm text-muted-foreground">
                  Total selected: {countSelectedQuestions()}
                </p>
                <ScrollArea className="h-72 border bg-background rounded-md p-3">
                  {selectedUnit.vocabulary.length === 0 && selectedUnit.grammar.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">This unit has no vocabulary or grammar items defined yet.</p>
                  )}
                  {selectedUnit.vocabulary.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-primary flex items-center gap-2 mb-2 border-b pb-1"><BookOpenText size={18}/>Vocabulary Items</h4>
                      {selectedUnit.vocabulary.map(vr => (
                        <div key={vr.id} className="mb-3 pl-2">
                          <h5 className="font-normal text-sm text-muted-foreground mb-1 italic">{vr.title}</h5>
                          {vr.words.map(word => (
                            <div key={word.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-md transition-colors">
                              <Checkbox
                                id={`q-${word.id}`}
                                checked={!!selectedQuestions[word.id]}
                                onCheckedChange={() => handleQuestionSelection(word.id)}
                                aria-label={`Select question: ${word.russian}`}
                              />
                              <Label htmlFor={`q-${word.id}`} className="flex-1 cursor-pointer text-sm font-normal text-foreground hover:text-primary">
                                {word.russian} <span className="text-xs text-muted-foreground">({word.english})</span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedUnit.grammar.length > 0 && (
                    <div className="mb-4">
                       <h4 className="font-medium text-accent flex items-center gap-2 mb-2 border-b pb-1"><Type size={18}/>Grammar Questions</h4>
                      {selectedUnit.grammar.map(gr => (
                        <div key={gr.id} className="mb-3 pl-2">
                           <h5 className="font-normal text-sm text-muted-foreground mb-1 italic">{gr.title}</h5>
                          {gr.questions.map(q => (
                            <div key={q.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-md transition-colors">
                              <Checkbox
                                id={`q-${q.id}`}
                                checked={!!selectedQuestions[q.id]}
                                onCheckedChange={() => handleQuestionSelection(q.id)}
                                aria-label={`Select question: ${q.question.substring(0,50)}`}
                              />
                              <Label htmlFor={`q-${q.id}`} className="flex-1 cursor-pointer text-sm font-normal text-foreground hover:text-primary">
                                {q.question.substring(0, 60)}{q.question.length > 60 ? "..." : ""} 
                                <span className="text-xs text-muted-foreground"> ({q.questionType.replace('-', ' ')})</span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                value={durationMinutes === 0 ? '' : durationMinutes} // Show empty if 0 for better UX
                onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) {
                      setDurationMinutes(val);
                    } else if (e.target.value === "") {
                      setDurationMinutes(0); // Internally treat as 0, or a default minimum
                    }
                }}
                placeholder="e.g., 30"
                min="1"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full md:w-auto" 
              disabled={!selectedUnit || countSelectedQuestions() === 0 || durationMinutes <= 0}
            >
              Create Test
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
