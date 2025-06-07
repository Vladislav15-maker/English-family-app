import type { AllStudentsProgress, StudentUnitProgress, StudentRoundProgress, Unit, VocabRound, GrammarRound } from '@/types';
import { getMockStudentProgress, saveStudentProgress } from './mock-data';
import { courseUnits } from './course-data';

// Get progress for a specific round (vocab or grammar or test)
export const getStudentRoundProgress = (
  studentId: string,
  unitId: string,
  roundId: string,
  type: 'vocabulary' | 'grammar' | 'test'
): StudentRoundProgress | undefined => {
  const currentGlobalProgress = getMockStudentProgress();
  const studentProgress = currentGlobalProgress[studentId];
  if (!studentProgress || !studentProgress[unitId]) {
    return undefined; 
  }
  const unitData = studentProgress[unitId];
  if (type === 'test') return unitData.unitTest;
  return type === 'vocabulary' ? unitData.vocabRounds[roundId] : unitData.grammarRounds[roundId];
};

// Get progress for a specific unit
export const getStudentProgressForUnit = (studentId: string, unitId: string): StudentUnitProgress | undefined => {
  const currentGlobalProgress = getMockStudentProgress();
  const studentUnits = currentGlobalProgress[studentId];

  if (!studentUnits || !studentUnits[unitId]) {
    const unit = courseUnits.find(u => u.id === unitId);
    if (!unit) return undefined; 

    // Initialize progress for this student and unit if it doesn't exist
    const defaultUnitProgress: StudentUnitProgress = {
      unitId: unitId,
      vocabRounds: {},
      grammarRounds: {},
      unitTest: undefined,
      overallCompletion: 0,
    };
    unit.vocabulary.forEach(vr => {
      defaultUnitProgress.vocabRounds[vr.id] = { roundId: vr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: vr.words.length, attempts: [] };
    });
    unit.grammar.forEach(gr => {
      defaultUnitProgress.grammarRounds[gr.id] = { roundId: gr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: gr.questions.length, attempts: [] };
    });
    
    if (!currentGlobalProgress[studentId]) currentGlobalProgress[studentId] = {};
    currentGlobalProgress[studentId][unitId] = defaultUnitProgress;
    saveStudentProgress(currentGlobalProgress); 
    return defaultUnitProgress;
  }
  // Ensure overallCompletion is calculated before returning existing progress
  calculateOverallUnitCompletion(studentUnits[unitId]); 
  return studentUnits[unitId];
};

// Update progress for a specific round
export const updateStudentRoundProgress = (
  studentId: string,
  unitId: string,
  roundId: string,
  type: 'vocabulary' | 'grammar',
  newAttempt: { answers: { itemId: string; studentAnswer: string; isCorrect: boolean }[]; score: number }
): void => {
  const currentGlobalProgress = getMockStudentProgress();
  if (!currentGlobalProgress[studentId]) currentGlobalProgress[studentId] = {};
  
  let unitProgress = currentGlobalProgress[studentId][unitId];
  if (!unitProgress) {
     const unit = courseUnits.find(u => u.id === unitId);
     if (!unit) return; 
     const newUnitProgress: StudentUnitProgress = {
        unitId,
        vocabRounds: {},
        grammarRounds: {},
        unitTest: undefined,
        overallCompletion: 0,
     };
     unit.vocabulary.forEach(vr => newUnitProgress.vocabRounds[vr.id] = { roundId: vr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: vr.words.length, attempts: []});
     unit.grammar.forEach(gr => newUnitProgress.grammarRounds[gr.id] = { roundId: gr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: gr.questions.length, attempts: []});
     currentGlobalProgress[studentId][unitId] = newUnitProgress;
     unitProgress = newUnitProgress;
  }

  let roundProgress: StudentRoundProgress | undefined;
  let totalQuestionsInRound = 0;

  if (type === 'vocabulary') {
    roundProgress = unitProgress.vocabRounds[roundId];
    const vocabRound = courseUnits.find(u => u.id === unitId)?.vocabulary.find(vr => vr.id === roundId);
    totalQuestionsInRound = vocabRound?.words.length || 0;
  } else {
    roundProgress = unitProgress.grammarRounds[roundId];
    const grammarRound = courseUnits.find(u => u.id === unitId)?.grammar.find(gr => gr.id === roundId);
    totalQuestionsInRound = grammarRound?.questions.length || 0;
  }

  if (!roundProgress) { 
    roundProgress = { 
        roundId, 
        completed: false, 
        score: 0, 
        correctAnswers: 0, 
        totalQuestions: totalQuestionsInRound, 
        attempts: [] 
    };
    if (type === 'vocabulary') unitProgress.vocabRounds[roundId] = roundProgress;
    else unitProgress.grammarRounds[roundId] = roundProgress;
  }
  
  roundProgress.attempts.push({ answers: newAttempt.answers, score: newAttempt.score, timestamp: new Date() });
  roundProgress.score = Math.max(roundProgress.score, newAttempt.score); 
  roundProgress.correctAnswers = newAttempt.answers.filter(a => a.isCorrect).length;
  roundProgress.completed = true;

  calculateOverallUnitCompletion(unitProgress);
  saveStudentProgress(currentGlobalProgress); 
};

export const setManualUnitTestScore = (
  studentId: string,
  unitId: string,
  score: number
): void => {
  const currentGlobalProgress = getMockStudentProgress();
  if (!currentGlobalProgress[studentId]) currentGlobalProgress[studentId] = {};
  
  let unitProgress = currentGlobalProgress[studentId][unitId];
  if (!unitProgress) {
    const unit = courseUnits.find(u => u.id === unitId);
    if (!unit) {
      console.error(`Cannot set test score: Unit ${unitId} not found.`);
      return;
    }
    unitProgress = {
      unitId,
      vocabRounds: {},
      grammarRounds: {},
      unitTest: undefined,
      overallCompletion: 0,
    };
    unit.vocabulary.forEach(vr => unitProgress.vocabRounds[vr.id] = { roundId: vr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: vr.words.length, attempts: []});
    unit.grammar.forEach(gr => unitProgress.grammarRounds[gr.id] = { roundId: gr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: gr.questions.length, attempts: []});
    currentGlobalProgress[studentId][unitId] = unitProgress;
  }

  const testRoundId = `${unitId}-manual-test`; 

  unitProgress.unitTest = {
    roundId: testRoundId,
    completed: true,
    score: Math.max(0, Math.min(100, score)), 
    correctAnswers: 0, 
    totalQuestions: 0, 
    attempts: [{ 
      answers: [],
      score: Math.max(0, Math.min(100, score)),
      timestamp: new Date()
    }]
  };

  calculateOverallUnitCompletion(unitProgress);
  saveStudentProgress(currentGlobalProgress);
};


export const calculateOverallUnitCompletion = (unitProgress: StudentUnitProgress): void => {
  let totalScore = 0;
  let totalRoundsCount = 0; // Only count rounds that contribute to score (homework rounds)
  let homeworkCompletionScore = 0; // Sum of scores from vocab and grammar rounds
  let homeworkRoundsCount = 0;


  Object.values(unitProgress.vocabRounds).forEach(rp => {
    homeworkCompletionScore += rp.score;
    homeworkRoundsCount++;
  });
  Object.values(unitProgress.grammarRounds).forEach(rp => {
    homeworkCompletionScore += rp.score;
    homeworkRoundsCount++;
  });
  
  // Overall completion for the unit is based on homework rounds average.
  // Test score is separate.
  unitProgress.overallCompletion = homeworkRoundsCount > 0 ? homeworkCompletionScore / homeworkRoundsCount : 0;
};

export interface StudentProgressSummary {
  totalUnits: number;
  completedUnits: number; // Units where homework average is 100%
  overallAverageCompletion: number; // Average of homework completion across all units
}

export const getOverallStudentProgress = (studentId: string): StudentProgressSummary => {
  const currentGlobalProgress = getMockStudentProgress();
  const studentUnitsProgress = currentGlobalProgress[studentId] || {};
  let totalHomeworkCompletionSum = 0;
  let completedHomeworkUnitsCount = 0;
  
  courseUnits.forEach(unit => {
    const unitProgress = studentUnitsProgress[unit.id];
    if (unitProgress) {
      calculateOverallUnitCompletion(unitProgress); 
      totalHomeworkCompletionSum += unitProgress.overallCompletion; // This is homework completion
      if (unitProgress.overallCompletion >= 100) {
        completedHomeworkUnitsCount++;
      }
    }
    // If unitProgress is undefined for a unit, its overallCompletion is effectively 0 for the average
  });

  return {
    totalUnits: courseUnits.length,
    completedUnits: completedHomeworkUnitsCount,
    overallAverageCompletion: courseUnits.length > 0 ? totalHomeworkCompletionSum / courseUnits.length : 0,
  };
};


export const getAllStudentsProgressData = (): AllStudentsProgress => {
  const currentGlobalProgress = getMockStudentProgress(); // Ensures latest from localStorage
  Object.values(currentGlobalProgress).forEach(studentUnits => {
    Object.values(studentUnits).forEach(unitProg => {
      calculateOverallUnitCompletion(unitProg);
    });
  });
  // saveStudentProgress(currentGlobalProgress); // Not strictly necessary to save again if just reading, unless calculateOverall changes it
  return currentGlobalProgress;
};


