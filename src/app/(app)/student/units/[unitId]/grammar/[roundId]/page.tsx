
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getGrammarRoundById, getUnitById } from '@/lib/course-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Lightbulb, RefreshCw, XCircle } from 'lucide-react';
import type { GrammarQuestion, PracticeSessionState, StudentAnswer } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { updateStudentRoundProgress, getStudentRoundProgress } from '@/lib/progress-utils';
import { Progress } from '@/components/ui/progress';

// Helper function to normalize answers (lowercase, trim, remove trailing period)
const normalizeAnswer = (answer: string): string => {
  let normalized = answer.trim().toLowerCase();
  if (normalized.endsWith('.')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
};

export default function GrammarPracticePage() {
  const params = useParams();
  const router = useRouter();
  const { studentData, user } = useAuth();
  const { toast } = useToast();

  const unitId = params.unitId as string;
  const roundId = params.roundId as string;

  const [session, setSession] = useState<PracticeSessionState>({
    currentQuestionIndex: 0,
    userAnswers: {},
    showResults: false,
    score: 0,
    hintsUsedThisSession: 0,
  });
  
  const [currentQuestion, setCurrentQuestion] = useState<GrammarQuestion | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const unit = getUnitById(unitId);
  const grammarRound = getGrammarRoundById(unitId, roundId);

  useEffect(() => {
    if (grammarRound && grammarRound.questions.length > 0) {
      setCurrentQuestion(grammarRound.questions[session.currentQuestionIndex]);
    }
  }, [grammarRound, session.currentQuestionIndex]);

  if (!studentData || !user) return <div className="text-center p-8">Loading student data...</div>;
  if (!unit || !grammarRound) return <div className="text-center p-8">Grammar round not found.</div>;

  const questions = grammarRound.questions;

  const handleAnswerSubmit = () => {
    if (!currentQuestion) return;
    
    const studentTypedAnswer = currentAnswer.trim();
    let isCorrect = false;
    if (currentQuestion.questionType === 'multiple-choice') {
      isCorrect = studentTypedAnswer === currentQuestion.correctAnswer;
    } else { // fill-in-the-blank or transform
      isCorrect = normalizeAnswer(studentTypedAnswer) === normalizeAnswer(currentQuestion.correctAnswer);
    }
    
    setSession(prev => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [currentQuestion.id]: studentTypedAnswer,
      }
    }));
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    setTimeout(() => {
      setFeedback(null);
      setCurrentAnswer('');

      setSession(prevSessionInTimeout => {
        if (prevSessionInTimeout.currentQuestionIndex < questions.length - 1) {
          return { ...prevSessionInTimeout, currentQuestionIndex: prevSessionInTimeout.currentQuestionIndex + 1 };
        } else {
          // Last question: Calculate results using the latest state
          let correctCount = 0;
          const finalAnswersArray: StudentAnswer[] = questions.map(q => {
            const userAnswer = prevSessionInTimeout.userAnswers[q.id] || ""; 
            let isQCorrect = false;
            if (q.questionType === 'multiple-choice') {
              isQCorrect = userAnswer === q.correctAnswer;
            } else {
              isQCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer);
            }
            if (isQCorrect) correctCount++;
            return { itemId: q.id, studentAnswer: userAnswer, isCorrect: isQCorrect };
          });
          
          const finalScore = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
          
          updateStudentRoundProgress(studentData.id, unitId, roundId, 'grammar', { answers: finalAnswersArray, score: finalScore });
          
          return { 
            ...prevSessionInTimeout, 
            score: finalScore, 
            showResults: true 
          };
        }
      });
    }, 1500);
  };

  const useHint = () => {
     if (!currentQuestion || studentData.hintsRemaining <= session.hintsUsedThisSession) {
      toast({ title: "No Hints Left", description: "You've used all your hints for this session or globally.", variant: "destructive" });
      return;
    }
    
    if (currentQuestion.questionType === 'multiple-choice') {
        toast({title: "Hint", description: "For multiple choice, try to eliminate options."});
    } else { // fill-in-the-blank or transform
        toast({ title: "Hint", description: `Correct answer is: ${currentQuestion.correctAnswer}` });
    }

    setSession(prev => ({...prev, hintsUsedThisSession: prev.hintsUsedThisSession + 1}));
    // Note: global hintsRemaining in studentData should be updated in AuthContext/backend ideally
    // For now, we just show the remaining hints based on initial studentData.hintsRemaining
    toast({ title: "Hint Used!", description: `${Math.max(0, studentData.hintsRemaining - session.hintsUsedThisSession)} hints left globally.` });
  };

  const handleRetry = () => {
    setSession({
      currentQuestionIndex: 0,
      userAnswers: {},
      showResults: false,
      score: 0,
      hintsUsedThisSession: 0,
    });
    setCurrentAnswer('');
    setFeedback(null);
  };
  
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;
    switch (currentQuestion.questionType) {
      case 'multiple-choice':
        return (
          <RadioGroup value={currentAnswer} onValueChange={setCurrentAnswer} className="space-y-2" disabled={!!feedback}>
            {currentQuestion.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="text-md flex-1 cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'fill-in-the-blank':
      case 'transform':
        return (
          <Input
            type="text"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !feedback && handleAnswerSubmit()}
            placeholder={currentQuestion.questionType === 'fill-in-the-blank' ? "Type your answer" : "Type the transformed sentence"}
            className="text-lg text-center max-w-md mx-auto"
            disabled={!!feedback}
          />
        );
      default:
        return null;
    }
  };


  if (session.showResults) {
    const studentRoundProgress = getStudentRoundProgress(studentData.id, unitId, roundId, 'grammar');
    // Recalculate correctAnswersCount from the final session.userAnswers to ensure display matches score logic
    const correctAnswersCount = questions.filter(q => {
        const userAnswer = session.userAnswers[q.id] || "";
        if (q.questionType === 'multiple-choice') return userAnswer === q.correctAnswer;
        return normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer);
    }).length;

    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Round Complete!</CardTitle>
            <CardDescription>{grammarRound.title} - {unit.title}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-5xl font-bold text-primary mb-4">{session.score.toFixed(0)}%</p>
            <p className="text-muted-foreground mb-6">
              You answered {correctAnswersCount} out of {questions.length} questions correctly.
            </p>
             <h3 className="font-semibold mb-2 text-lg">Summary:</h3>
            <ul className="space-y-1 text-left max-h-60 overflow-y-auto p-2 border rounded-md">
            {questions.map(q => {
              const userAnswer = session.userAnswers[q.id] || "No answer";
              let isCorrect = false;
              if (q.questionType === 'multiple-choice') {
                  isCorrect = userAnswer === q.correctAnswer;
              } else {
                  isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer);
              }
              return (
                <li key={q.id} className={`flex justify-between items-center p-1 rounded ${isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <span className="truncate" title={q.question}>{q.question.substring(0,30)}...: <span className="italic">{userAnswer}</span></span>
                  {isCorrect ? <CheckCircle className="text-green-500 h-5 w-5" /> : <XCircle className="text-red-500 h-5 w-5" />}
                </li>
              );
            })}
            </ul>
            <p className="text-sm text-muted-foreground mt-4">Note: Correct answers are not shown for incorrect attempts to encourage learning and hint usage.</p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleRetry} className="w-full sm:w-auto" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Retry Round
            </Button>
            <Button onClick={() => router.push(`/student/units/${unitId}`)} className="w-full sm:w-auto">
              Back to Unit
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const progressPercentage = questions.length > 0 ? ((session.currentQuestionIndex) / questions.length) * 100 : 0;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.push(`/student/units/${unitId}`)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Unit
      </Button>
      
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center">{unit.title} - Grammar: {grammarRound.title}</CardTitle>
           <Progress value={progressPercentage} className="w-full h-2 mt-2" />
           <p className="text-xs text-muted-foreground text-center mt-1">Question {session.currentQuestionIndex + 1} of {questions.length}</p>
        </CardHeader>
        <CardContent className="min-h-[250px] flex flex-col items-center justify-center">
          {currentQuestion ? (
            <div className="text-center w-full space-y-4">
              <p className="text-xl font-medium mb-2 text-foreground px-4">{currentQuestion.question}</p>
              {currentQuestion.exampleTransformation && currentQuestion.questionType === 'transform' && (
                <p className="text-sm text-muted-foreground mb-3">Example: {currentQuestion.exampleTransformation}</p>
              )}
              {renderQuestionInput()}
              {feedback === 'correct' && <p className="text-green-500 mt-3 font-semibold">Correct!</p>}
              {feedback === 'incorrect' && <p className="text-red-500 mt-3 font-semibold">Incorrect.</p>}
            </div>
          ) : (
            <p>Loading question...</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <Button 
            onClick={useHint} 
            variant="outline" 
            size="sm"
            disabled={!!feedback || studentData.hintsRemaining <= session.hintsUsedThisSession || session.hintsUsedThisSession >= grammarRound.questions.length } // Limit hints per round to number of questions or global limit
          >
            <Lightbulb className="mr-2 h-4 w-4" /> Hint ({Math.max(0, studentData.hintsRemaining - session.hintsUsedThisSession)} left)
          </Button>
          <Button onClick={handleAnswerSubmit} disabled={!currentAnswer.trim() || !!feedback} className="min-w-[120px]">
            {session.currentQuestionIndex === questions.length - 1 ? 'Finish Round' : 'Next Question'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    
