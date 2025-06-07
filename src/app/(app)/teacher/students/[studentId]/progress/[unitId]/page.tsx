"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mockStudents } from '@/lib/mock-data';
import { getUnitById } from '@/lib/course-data';
import { getStudentProgressForUnit, getStudentRoundProgress } from '@/lib/progress-utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import type { Student, Unit, StudentUnitProgress, StudentRoundProgress, VocabRound, GrammarRound, StudentAnswer } from '@/types';
import { Progress } from '@/components/ui/progress';

export default function TeacherStudentUnitProgressPage() {
  const params = useParams();
  const router = useRouter();
  const { teacherData } = useAuth();

  const studentId = params.studentId as string;
  const unitId = params.unitId as string;

  const student = mockStudents.find(s => s.id === studentId);
  const unit = getUnitById(unitId);
  
  if (!teacherData) return <div className="p-8 text-center">Loading teacher data...</div>;
  if (!student) return <div className="p-8 text-center">Student not found.</div>;
  if (!unit) return <div className="p-8 text-center">Unit not found.</div>;

  const unitProgress = getStudentProgressForUnit(student.id, unit.id);

  const RoundProgressDetails = ({ round, type, studentProgress }: { round: VocabRound | GrammarRound, type: 'vocabulary' | 'grammar', studentProgress?: StudentRoundProgress }) => {
    if (!studentProgress || studentProgress.attempts.length === 0) {
      return (
        <div>
          <p className="font-semibold">{round.title} ({type})</p>
          <p className="text-sm text-muted-foreground">No attempts yet. Score: {studentProgress?.score ?? 0}%</p>
        </div>
      );
    }

    // Display details of the last attempt for simplicity
    const lastAttempt = studentProgress.attempts[studentProgress.attempts.length - 1];
    const items = type === 'vocabulary' ? (round as VocabRound).words : (round as GrammarRound).questions;

    return (
      <div className="mb-4 p-3 border rounded-md">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-md">{round.title} <span className="text-xs capitalize text-muted-foreground">({type})</span></h4>
            <span className={`font-bold text-lg ${studentProgress.score >= 80 ? 'text-primary' : 'text-orange-500'}`}>{studentProgress.score.toFixed(0)}%</span>
        </div>
        <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
          {lastAttempt.answers.map((answer, index) => {
            const item = items.find(i => i.id === answer.itemId);
            const promptText = type === 'vocabulary' ? (item as any)?.russian : (item as any)?.question;
            const correctAnswerText = type === 'vocabulary' ? (item as any)?.english : (item as any)?.correctAnswer;

            return (
              <li key={index} className={`p-1.5 rounded-sm flex justify-between items-center ${answer.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="truncate">
                  <span className="font-medium">{promptText?.substring(0,30) || 'N/A'}{promptText && promptText.length > 30 ? '...' : ''}: </span> 
                  <span className="italic">{answer.studentAnswer || "No Answer"}</span>
                  {!answer.isCorrect && <span className="text-xs text-red-700"> (Correct: {correctAnswerText})</span>}
                </div>
                {answer.isCorrect ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">
            {student.name}'s Progress - {unit.title}
          </CardTitle>
          <CardDescription>Detailed view of {student.name}'s performance in {unit.description}.</CardDescription>
            <div className="mt-2">
                <Progress value={unitProgress?.overallCompletion ?? 0} className="w-full h-3" />
                <p className="text-sm text-muted-foreground mt-1 text-right">{unitProgress?.overallCompletion.toFixed(0) ?? 0}% Overall Unit Completion</p>
            </div>
        </CardHeader>
        <CardContent>
          {unitProgress ? (
            <div>
              <section className="mb-6">
                <h3 className="text-xl font-semibold mb-3 border-b pb-2">Vocabulary Rounds</h3>
                {unit.vocabulary.length > 0 ? unit.vocabulary.map(vr => (
                  <RoundProgressDetails 
                    key={vr.id} 
                    round={vr} 
                    type="vocabulary" 
                    studentProgress={getStudentRoundProgress(student.id, unit.id, vr.id, 'vocabulary')} 
                  />
                )) : <p className="text-muted-foreground">No vocabulary rounds in this unit.</p>}
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 border-b pb-2">Grammar Rounds</h3>
                {unit.grammar.length > 0 ? unit.grammar.map(gr => (
                  <RoundProgressDetails 
                    key={gr.id} 
                    round={gr} 
                    type="grammar" 
                    studentProgress={getStudentRoundProgress(student.id, unit.id, gr.id, 'grammar')}
                  />
                )) : <p className="text-muted-foreground">No grammar rounds in this unit.</p>}
              </section>
              
              {/* Placeholder for Unit Test results */}
              <section className="mt-6">
                 <h3 className="text-xl font-semibold mb-3 border-b pb-2">Unit Test</h3>
                 {unitProgress.unitTest && unitProgress.unitTest.completed ? (
                    <RoundProgressDetails 
                        round={{id: "unit-test", title: "Unit Test", questions: []}} /* Mock round structure */
                        type="grammar" /* Or a generic 'test' type */
                        studentProgress={unitProgress.unitTest}
                    />
                 ) : <p className="text-muted-foreground">Unit test not attempted or not available.</p>}
              </section>

            </div>
          ) : (
            <p className="text-muted-foreground">No progress recorded for this student in this unit yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
