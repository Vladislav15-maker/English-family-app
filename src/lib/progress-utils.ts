import type { AllStudentsProgress, StudentUnitProgress, StudentRoundProgress, Unit, VocabRound, GrammarRound } from '@/types';
import { mockStudentProgress } from './mock-data';
import { courseUnits } from './course-data';

// Get progress for a specific round (vocab or grammar)
export const getStudentRoundProgress = (
  studentId: string,
  unitId: string,
  roundId: string,
  type: 'vocabulary' | 'grammar'
): StudentRoundProgress | undefined => {
  const studentProgress = mockStudentProgress[studentId];
  if (!studentProgress || !studentProgress[unitId]) {
    // Initialize if not present (should ideally be pre-initialized)
    return undefined; 
  }
  const unitData = studentProgress[unitId];
  return type === 'vocabulary' ? unitData.vocabRounds[roundId] : unitData.grammarRounds[roundId];
};

// Get progress for a specific unit
export const getStudentProgressForUnit = (studentId: string, unitId: string): StudentUnitProgress | undefined => {
  const studentProgress = mockStudentProgress[studentId];
   if (!studentProgress || !studentProgress[unitId]) {
    // If progress for this unit doesn't exist for the student, create a default structure.
    // This helps in displaying 0% for unattempted units.
    const unit = courseUnits.find(u => u.id === unitId);
    if (!unit) return undefined; // Should not happen if unitId is valid

    const defaultUnitProgress: StudentUnitProgress = {
      unitId: unitId,
      vocabRounds: {},
      grammarRounds: {},
      overallCompletion: 0,
    };
    unit.vocabulary.forEach(vr => {
      defaultUnitProgress.vocabRounds[vr.id] = { roundId: vr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: vr.words.length, attempts: [] };
    });
    unit.grammar.forEach(gr => {
      defaultUnitProgress.grammarRounds[gr.id] = { roundId: gr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: gr.questions.length, attempts: [] };
    });
    
    if(!studentProgress) mockStudentProgress[studentId] = {};
    mockStudentProgress[studentId][unitId] = defaultUnitProgress;
    return defaultUnitProgress;
  }
  return studentProgress[unitId];
};

// Update progress for a specific round
export const updateStudentRoundProgress = (
  studentId: string,
  unitId: string,
  roundId: string,
  type: 'vocabulary' | 'grammar',
  newAttempt: { answers: { itemId: string; studentAnswer: string; isCorrect: boolean }[]; score: number }
): void => {
  // Ensure student and unit progress objects exist
  if (!mockStudentProgress[studentId]) mockStudentProgress[studentId] = {};
  if (!mockStudentProgress[studentId][unitId]) {
     const unit = courseUnits.find(u => u.id === unitId);
     if (!unit) return; // Unit not found
     // Initialize unit progress if it doesn't exist
     const newUnitProgress: StudentUnitProgress = {
        unitId,
        vocabRounds: {},
        grammarRounds: {},
        overallCompletion: 0,
     };
     unit.vocabulary.forEach(vr => newUnitProgress.vocabRounds[vr.id] = { roundId: vr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: vr.words.length, attempts: []});
     unit.grammar.forEach(gr => newUnitProgress.grammarRounds[gr.id] = { roundId: gr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: gr.questions.length, attempts: []});
     mockStudentProgress[studentId][unitId] = newUnitProgress;
  }

  const unitProgress = mockStudentProgress[studentId][unitId];
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

  if (!roundProgress) { // Initialize round progress if it doesn't exist
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
  roundProgress.score = Math.max(roundProgress.score, newAttempt.score); // Keep best score
  roundProgress.correctAnswers = newAttempt.answers.filter(a => a.isCorrect).length;
  roundProgress.completed = true; // Mark as completed once attempted

  calculateOverallUnitCompletion(unitProgress);
};

// Calculate overall completion for a unit
const calculateOverallUnitCompletion = (unitProgress: StudentUnitProgress): void => {
  let totalScore = 0;
  let totalRounds = 0;

  Object.values(unitProgress.vocabRounds).forEach(rp => {
    totalScore += rp.score;
    totalRounds++;
  });
  Object.values(unitProgress.grammarRounds).forEach(rp => {
    totalScore += rp.score;
    totalRounds++;
  });
  // Add unit test score if available
  if (unitProgress.unitTest) {
    totalScore += unitProgress.unitTest.score;
    totalRounds++;
  }

  unitProgress.overallCompletion = totalRounds > 0 ? totalScore / totalRounds : 0;
};

export interface StudentProgressSummary {
  totalUnits: number;
  completedUnits: number;
  overallAverageCompletion: number;
  // Potentially more detailed stats here
}

// Get overall progress summary for a student
export const getOverallStudentProgress = (studentId: string): StudentProgressSummary => {
  const studentUnitsProgress = mockStudentProgress[studentId] || {};
  let totalCompletionSum = 0;
  let unitsAttempted = 0;
  let completedUnitsCount = 0;
  
  courseUnits.forEach(unit => {
    const unitProgress = studentUnitsProgress[unit.id];
    if (unitProgress) {
      calculateOverallUnitCompletion(unitProgress); // Recalculate to be sure
      totalCompletionSum += unitProgress.overallCompletion;
      unitsAttempted++;
      if (unitProgress.overallCompletion >= 100) {
        completedUnitsCount++;
      }
    }
  });

  return {
    totalUnits: courseUnits.length,
    completedUnits: completedUnitsCount,
    overallAverageCompletion: unitsAttempted > 0 ? totalCompletionSum / courseUnits.length : 0, // Average over ALL units
  };
};


// Example function to get all progress data (useful for teacher views)
export const getAllStudentsProgressData = (): AllStudentsProgress => {
  // Ensure all calculations are up-to-date
  Object.values(mockStudentProgress).forEach(studentUnits => {
    Object.values(studentUnits).forEach(unitProg => {
      calculateOverallUnitCompletion(unitProg);
    });
  });
  return mockStudentProgress;
};
