"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getVocabRoundById, getUnitById } from '@/lib/course-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Lightbulb, RefreshCw, XCircle, Play, Eye } from 'lucide-react';
import type { Word, PracticeSessionState, StudentAnswer } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { updateStudentRoundProgress, getStudentRoundProgress } from '@/lib/progress-utils';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

type VocabPracticeMode = 'review' | 'practice' | 'results';

export default function VocabularyPracticePage() {
  const params = useParams();
  const router = useRouter();
  const { studentData, user } = useAuth();
  const { toast } = useToast();

  const unitId = params.unitId as string;
  const roundId = params.roundId as string;

  const [mode, setMode] = useState<VocabPracticeMode>('review');
  const [session, setSession] = useState<PracticeSessionState>({
    currentQuestionIndex: 0,
    userAnswers: {},
    score: 0,
    hintsUsedThisSession: 0,
  });
  
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const mountedRef = useRef(false); 

  const unit = getUnitById(unitId);
  const vocabRound = getVocabRoundById(unitId, roundId);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);


  useEffect(() => {
    if (mode === 'practice' && vocabRound && vocabRound.words.length > 0) {
      setCurrentWord(vocabRound.words[session.currentQuestionIndex]);
    } else {
      setCurrentWord(null);
    }
  }, [mode, vocabRound, session.currentQuestionIndex]);
  

  if (!studentData || !user) return <div className="text-center p-8">Loading student data...</div>;
  if (!unit || !vocabRound) return <div className="text-center p-8">Vocabulary round not found.</div>;

  const words = vocabRound.words;

  const handleAnswerSubmit = () => {
    if (!currentWord) return;
    
    const studentTypedAnswer = currentAnswer.trim();
    const isCorrect = studentTypedAnswer.toLowerCase() === currentWord.english.toLowerCase();
    
    setSession(prev => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [currentWord.id]: studentTypedAnswer,
      }
    }));
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    setTimeout(() => {
      if (!mountedRef.current) return; 
      setFeedback(null);
      setCurrentAnswer(''); 

      setSession(prevSessionInTimeout => {
        if (prevSessionInTimeout.currentQuestionIndex < words.length - 1) {
          return { 
            ...prevSessionInTimeout, 
            currentQuestionIndex: prevSessionInTimeout.currentQuestionIndex + 1 
          };
        } else {
          let correctCount = 0;
          const finalAnswersArray: StudentAnswer[] = [];

          words.forEach(word => {
            const userAnswer = prevSessionInTimeout.userAnswers[word.id] || ""; 
            const isWordCorrect = userAnswer.toLowerCase() === word.english.toLowerCase();
            if (isWordCorrect) {
              correctCount++;
            }
            finalAnswersArray.push({ itemId: word.id, studentAnswer: userAnswer, isCorrect: isWordCorrect });
          });
          
          const finalScore = words.length > 0 ? (correctCount / words.length) * 100 : 0;
          
          updateStudentRoundProgress(studentData.id, unitId, roundId, 'vocabulary', { answers: finalAnswersArray, score: finalScore });
          
          setMode('results'); 
          
          return { 
            ...prevSessionInTimeout, 
            score: finalScore,
          };
        }
      });
    }, 1500);
  };

  const useHint = () => {
    if (!currentWord) return;
    if (studentData.hintsRemaining <= session.hintsUsedThisSession) {
      toast({
        title: "No Hints Available",
        description: "You've used all your available hints.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Hint Used",
      description: `Correct answer is: ${currentWord.english}`,
    });
    setSession(prev => ({ ...prev, hintsUsedThisSession: prev.hintsUsedThisSession + 1 }));
  };

  const handleRetry = () => {
    setSession({
      currentQuestionIndex: 0,
      userAnswers: {},
      score: 0,
      hintsUsedThisSession: 0,
    });
    setCurrentAnswer('');
    setFeedback(null);
    setMode('review');
  };

  const startPractice = () => {
    setSession(prev => ({
      ...prev,
      currentQuestionIndex: 0,
      userAnswers: {}, 
      score: 0, 
      hintsUsedThisSession: 0, 
    }));
    setCurrentAnswer('');
    setFeedback(null);
    setMode('practice');
  };

  if (mode === 'review') {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Button variant="outline" onClick={() => router.push(`/student/units/${unitId}`)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Unit
        </Button>
        <Card className="w-full max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center">
              <Eye className="inline-block mr-2 h-6 w-6 align-text-bottom" />
              Обзор слов: {vocabRound.title}
            </CardTitle>
            <CardDescription className="text-center">{unit.title} - {vocabRound.words.length} слов. Просмотрите слова перед практикой.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <div className="space-y-3 p-1">
                {vocabRound.words.map(word => (
                  <Card key={word.id} className="bg-card/50 p-4">
                    <p className="text-lg font-semibold text-primary">{word.russian}</p>
                    <div className="flex items-center">
                        <p className="text-md text-foreground mr-2">Английский: {word.english}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Произношение: {word.transcription}</p>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={startPractice} size="lg">
              <Play className="mr-2 h-5 w-5" /> Начать практику
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (mode === 'results') {
    const correctAnswersCount = words.filter(word => session.userAnswers[word.id]?.toLowerCase() === word.english.toLowerCase()).length;
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Round Complete!</CardTitle>
            <CardDescription>{vocabRound.title} - {unit.title}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-5xl font-bold text-primary mb-4">{session.score.toFixed(0)}%</p>
            <p className="text-muted-foreground mb-6">
              You answered {correctAnswersCount} out of {words.length} words correctly.
            </p>
            <h3 className="font-semibold mb-2 text-lg">Summary:</h3>
            <ScrollArea className="max-h-60">
              <ul className="space-y-1 text-left p-2 border rounded-md">
              {words.map(word => {
                const userAnswer = session.userAnswers[word.id] || "No answer";
                const isCorrect = userAnswer.toLowerCase() === word.english.toLowerCase();
                return (
                  <li key={word.id} className={`p-1.5 rounded ${isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                     <div className="flex justify-between items-center w-full">
                        <div className="flex-grow truncate mr-2">
                            <span className="font-medium">{word.russian}:</span>{' '}
                            <span className="italic">{userAnswer}</span>
                            {!isCorrect && <span className="text-xs text-red-700 dark:text-red-400"> (Correct: {word.english})</span>}
                        </div>
                        <div className="flex items-center flex-shrink-0">
                            {isCorrect ? <CheckCircle className="text-green-500 h-5 w-5" /> : <XCircle className="text-red-500 h-5 w-5" />}
                        </div>
                    </div>
                  </li>
                );
              })}
              </ul>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleRetry} className="w-full sm:w-auto" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Повторить (Обзор)
            </Button>
            <Button onClick={() => router.push(`/student/units/${unitId}`)} className="w-full sm:w-auto">
              Back to Unit
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const progressPercentage = words.length > 0 ? (session.currentQuestionIndex / words.length) * 100 : 0;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button variant="outline" onClick={() => router.push(`/student/units/${unitId}`)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Unit
      </Button>
      
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center">{unit.title} - Vocabulary: {vocabRound.title}</CardTitle>
          <CardDescription className="text-center">Translate the Russian word into English.
          </CardDescription>
           <Progress value={progressPercentage} className="w-full h-2 mt-2" />
           <p className="text-xs text-muted-foreground text-center mt-1">Word {session.currentQuestionIndex + 1} of {words.length}</p>
        </CardHeader>
        <CardContent className="min-h-[200px] flex flex-col items-center justify-center">
          {currentWord ? (
            <div className="text-center w-full">
              <p className="text-4xl font-semibold mb-6 text-primary">{currentWord.russian}</p>
              <Input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !feedback && handleAnswerSubmit()}
                placeholder="Type English translation"
                className="text-lg text-center max-w-xs mx-auto"
                disabled={!!feedback}
                aria-label="English translation input"
              />
              {feedback === 'correct' && currentWord && (
                <div className="flex items-center justify-center text-green-500 mt-3 font-semibold">
                    <p>Correct!</p>
                </div>
              )}
              {feedback === 'incorrect' && currentWord && (
                 <div className="flex flex-col items-center justify-center text-red-500 mt-3 font-semibold">
                    <p>Incorrect.</p>
                    <div className="flex items-center">
                        <p className="mr-1">Correct: {currentWord.english}</p>
                    </div>
                </div>
              )}
            </div>
          ) : (
            <p>Loading word...</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <Button 
            onClick={useHint} 
            variant="outline" 
            size="sm"
            disabled={!!feedback || !currentWord || studentData.hintsRemaining <= session.hintsUsedThisSession || session.hintsUsedThisSession >= 5}
            aria-label={`Use hint, ${Math.max(0, studentData.hintsRemaining - session.hintsUsedThisSession)} left`}
          >
            <Lightbulb className="mr-2 h-4 w-4" /> Hint ({Math.max(0, studentData.hintsRemaining - session.hintsUsedThisSession)} left)
          </Button>
          <Button onClick={handleAnswerSubmit} disabled={!currentAnswer.trim() || !!feedback} className="min-w-[120px]">
            {session.currentQuestionIndex === words.length - 1 ? 'Finish Round' : 'Next Word'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}