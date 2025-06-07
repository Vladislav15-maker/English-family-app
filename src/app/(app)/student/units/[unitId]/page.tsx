"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUnitById } from '@/lib/course-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, Type, PlayCircle, Check, Percent, Award } from 'lucide-react';
import { getStudentProgressForUnit, getStudentRoundProgress } from '@/lib/progress-utils';
import type { VocabRound, GrammarRound } from '@/types';

export default function StudentUnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { studentData } = useAuth();
  const unitId = params.unitId as string;
  
  const unit = getUnitById(unitId);

  if (!studentData) return <div className="text-center p-8">Loading student data...</div>;
  if (!unit) return <div className="text-center p-8">Unit not found.</div>;

  const unitProgress = getStudentProgressForUnit(studentData.id, unit.id);

  const RoundCard = ({ round, type, index }: { round: VocabRound | GrammarRound, type: 'vocabulary' | 'grammar', index: number }) => {
    const roundId = round.id;
    const studentRoundProgress = getStudentRoundProgress(studentData.id, unit.id, roundId, type);
    const isCompleted = studentRoundProgress?.completed || studentRoundProgress?.score === 100;
    const score = studentRoundProgress?.score ?? 0;

    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-lg">{type === 'vocabulary' ? `Vocab ${round.title}` : `Grammar ${round.title}`}</CardTitle>
            {isCompleted && <Check className="h-6 w-6 text-primary" />}
          </div>
          <CardDescription>
            {type === 'vocabulary' ? `${(round as VocabRound).words.length} words` : `${(round as GrammarRound).questions.length} questions`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div className="bg-accent h-2 rounded-full" style={{ width: `${score}%` }}></div>
          </div>
          <p className="text-sm text-muted-foreground">{score}% achieved</p>
        </CardContent>
        <CardFooter>
          <Link href={`/student/units/${unit.id}/${type}/${round.id}`} passHref className="w-full">
            <Button className="w-full" variant={isCompleted ? "outline" : "default"}>
              <PlayCircle className="mr-2 h-4 w-4" /> {isCompleted ? (score === 100 ? 'Practice Again' : 'Retry Round') : 'Start Round'}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  };
  
  const overallProgress = unitProgress?.overallCompletion.toFixed(0) ?? 0;
  const unitTestScore = unitProgress?.unitTest?.score;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Units
      </Button>

      <Card className="mb-8 shadow-xl overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 relative">
            <Image
              src={`https://placehold.co/600x400.png?text=${encodeURIComponent(unit.title)}&bg=40BF40`}
              alt={unit.title}
              width={600}
              height={400}
              className="w-full h-64 md:h-full object-cover"
              data-ai-hint={unit.imagePlaceholder || "learning education"}
            />
          </div>
          <div className="md:w-2/3 p-6">
            <h1 className="text-4xl font-headline mb-2 text-foreground">{unit.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">{unit.description}</p>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Percent className="h-6 w-6" />
              <span className="text-2xl font-semibold">{overallProgress}% Overall Homework Completion</span>
            </div>
             {typeof unitTestScore === 'number' && (
              <div className="flex items-center gap-2 text-accent mb-4">
                <Award className="h-6 w-6" />
                <span className="text-xl font-semibold">Unit Test Score: {unitTestScore.toFixed(0)}%</span>
              </div>
            )}
            <div className="w-full bg-muted rounded-full h-4 mb-4">
              <div className="bg-primary h-4 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
            </div>
            <p className="text-sm text-muted-foreground">
              Complete all vocabulary and grammar rounds to master this unit. Unit test score is provided by your teacher.
            </p>
          </div>
        </div>
      </Card>

      <section className="mb-8">
        <h2 className="text-2xl font-headline mb-4 flex items-center text-foreground"><BookOpen className="mr-3 h-7 w-7 text-primary" />Vocabulary Rounds</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {unit.vocabulary.map((round, index) => (
            <RoundCard key={round.id} round={round} type="vocabulary" index={index + 1} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-headline mb-4 flex items-center text-foreground"><Type className="mr-3 h-7 w-7 text-accent" />Grammar Rounds</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {unit.grammar.map((round, index) => (
            <RoundCard key={round.id} round={round} type="grammar" index={index + 1} />
          ))}
        </div>
      </section>
      
      <div className="mt-12 text-center">
         <Card className="inline-block shadow-md">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Unit Test (Offline)</CardTitle>
            </CardHeader>
            <CardContent>
                {typeof unitTestScore === 'number' ? (
                    <p className="text-3xl font-bold text-primary">{unitTestScore.toFixed(0)}%</p>
                ) : (
                    <p className="text-muted-foreground">Score not yet available.</p>
                )}
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">This test is conducted offline by your teacher.</p>
            </CardFooter>
         </Card>
      </div>
    </div>
  );
}
