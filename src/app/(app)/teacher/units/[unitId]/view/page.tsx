"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUnitById } from '@/lib/course-data';
import type { Unit, VocabRound, GrammarRound, Word as WordType, GrammarQuestion } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpenText, Type, Edit, CheckSquare, List } from 'lucide-react'; // Added Edit
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function TeacherViewUnitPage() {
  const params = useParams();
  const router = useRouter();
  const { teacherData } = useAuth();
  const unitId = params.unitId as string;

  const unit = getUnitById(unitId);

  if (!teacherData) {
    return <div className="flex h-screen items-center justify-center">Loading teacher data...</div>;
  }
  if (!unit) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Button variant="outline" onClick={() => router.push('/teacher/units')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Units
        </Button>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-destructive">Unit Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The requested unit could not be found. It might have been moved or deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.push('/teacher/units')} className="mb-6 print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Units
      </Button>

      <Card className="shadow-xl mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-headline text-primary">{unit.title}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">{unit.description}</CardDescription>
            </div>
            <Badge variant={unit.isLocked ? "destructive" : "default"}>
              {unit.isLocked ? 'Locked' : 'Unlocked'}
            </Badge>
          </div>
           {unit.isLocked && unit.unlockDate && (
            <p className="text-sm text-muted-foreground">Unlocks on: {new Date(unit.unlockDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} at 18:00</p>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center">
              <BookOpenText className="mr-3 h-7 w-7 text-accent" />
              Vocabulary Rounds ({unit.vocabulary.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {unit.vocabulary.length > 0 ? (
                unit.vocabulary.map((vocabRound, vrIndex) => (
                  <div key={vocabRound.id} className="mb-6">
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{vocabRound.title}</h3>
                    <ul className="space-y-2">
                      {vocabRound.words.map((word) => (
                        <li key={word.id} className="p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors">
                          <p className="font-medium text-primary">{word.russian}</p>
                          <p className="text-sm text-foreground">English: {word.english}</p>
                          <p className="text-xs text-muted-foreground">Transcription: {word.transcription}</p>
                        </li>
                      ))}
                    </ul>
                    {vrIndex < unit.vocabulary.length - 1 && <Separator className="my-4" />}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No vocabulary rounds in this unit.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center">
              <Type className="mr-3 h-7 w-7 text-secondary-foreground" /> {/* Updated icon color for grammar */}
              Grammar Rounds ({unit.grammar.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {unit.grammar.length > 0 ? (
                unit.grammar.map((grammarRound, grIndex) => (
                  <div key={grammarRound.id} className="mb-6">
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{grammarRound.title}</h3>
                    <ul className="space-y-3">
                      {grammarRound.questions.map((q, qIndex) => (
                        <li key={q.id} className="p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors">
                          <p className="font-medium text-foreground mb-1">
                            {qIndex + 1}. {q.question}
                            <Badge variant="outline" className="ml-2 capitalize">{q.questionType.replace('-', ' ')}</Badge>
                          </p>
                          {q.questionType === 'multiple-choice' && q.options && (
                            <div className="text-sm text-muted-foreground">
                              Options: {q.options.join(', ')}
                            </div>
                          )}
                           {q.questionType === 'transform' && q.exampleTransformation && (
                            <div className="text-sm text-muted-foreground italic">
                              Example: {q.exampleTransformation}
                            </div>
                          )}
                          <p className="text-sm text-green-600 dark:text-green-500 font-semibold">Correct Answer: {q.correctAnswer}</p>
                        </li>
                      ))}
                    </ul>
                    {grIndex < unit.grammar.length - 1 && <Separator className="my-4" />}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No grammar rounds in this unit.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <CardFooter className="mt-8 justify-end print:hidden">
        <Button variant="default" onClick={() => alert('Editing unit content functionality will be available soon!')}>
          <Edit className="mr-2 h-4 w-4" /> Edit Unit Content
        </Button>
      </CardFooter>
    </div>
  );
}

