import type { AllStudentsProgress, StudentUnitProgress, StudentRoundProgress, Unit, VocabRound, GrammarRound } from '@/types';
import { mockStudentProgress, saveStudentProgress } from './mock-data';
import { courseUnits } from './course-data';

// Get progress for a specific round (vocab or grammar)
export const getStudentRoundProgress = (
  studentId: string,
  unitId: string,
  roundId: string,
  type: 'vocabulary' | 'grammar' | 'test' // Added 'test' for unit tests
): StudentRoundProgress | undefined => {
  const studentProgress = mockStudentProgress[studentId];
  if (!studentProgress || !studentProgress[unitId]) {
    return undefined; 
  }
  const unitData = studentProgress[unitId];
  if (type === 'test') return unitData.unitTest;
  return type === 'vocabulary' ? unitData.vocabRounds[roundId] : unitData.grammarRounds[roundId];
};

// Get progress for a specific unit
export const getStudentProgressForUnit = (studentId: string, unitId: string): StudentUnitProgress | undefined => {
  const studentProgress = mockStudentProgress[studentId];
   if (!studentProgress || !studentProgress[unitId]) {
    const unit = courseUnits.find(u => u.id === unitId);
    if (!unit) return undefined; 

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
    
    if(!studentProgress) mockStudentProgress[studentId] = {};
    mockStudentProgress[studentId][unitId] = defaultUnitProgress;
    saveStudentProgress(); // Save after initializing
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
  if (!mockStudentProgress[studentId]) mockStudentProgress[studentId] = {};
  if (!mockStudentProgress[studentId][unitId]) {
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
  saveStudentProgress(); // Save after any update
};

// New function for teacher to update/set a unit test score manually
export const setManualUnitTestScore = (
  studentId: string,
  unitId: string,
  score: number
): void => {
  if (!mockStudentProgress[studentId]) mockStudentProgress[studentId] = {};
  
  // Ensure unit progress exists or initialize it
  let unitProgress = mockStudentProgress[studentId][unitId];
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
    mockStudentProgress[studentId][unitId] = unitProgress;
  }

  const testRoundId = `${unitId}-manual-test`; // Consistent ID for the manual test

  unitProgress.unitTest = {
    roundId: testRoundId,
    completed: true,
    score: Math.max(0, Math.min(100, score)), // Clamp score between 0 and 100
    correctAnswers: 0, // Not applicable for manual score
    totalQuestions: 0, // Not applicable
    attempts: [{ // Create a single attempt representing the manual grade
      answers: [],
      score: Math.max(0, Math.min(100, score)),
      timestamp: new Date()
    }]
  };

  calculateOverallUnitCompletion(unitProgress);
  saveStudentProgress();
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
  
  if (unitProgress.unitTest && unitProgress.unitTest.completed) {
    totalScore += unitProgress.unitTest.score;
    totalRounds++;
  }

  unitProgress.overallCompletion = totalRounds > 0 ? totalScore / totalRounds : 0;
};

export interface StudentProgressSummary {
  totalUnits: number;
  completedUnits: number;
  overallAverageCompletion: number;
}

// Get overall progress summary for a student
export const getOverallStudentProgress = (studentId: string): StudentProgressSummary => {
  const studentUnitsProgress = mockStudentProgress[studentId] || {};
  let totalCompletionSum = 0;
  let unitsAttemptedOrGraded = 0; // Count units that have any progress or a test grade
  let completedUnitsCount = 0;
  
  courseUnits.forEach(unit => {
    const unitProgress = studentUnitsProgress[unit.id];
    if (unitProgress) {
      calculateOverallUnitCompletion(unitProgress); 
      totalCompletionSum += unitProgress.overallCompletion;
      // A unit is considered "active" if any round has progress or if the unit test is graded
      const hasRoundProgress = Object.values(unitProgress.vocabRounds).some(r => r.completed) || Object.values(unitProgress.grammarRounds).some(r => r.completed);
      if (hasRoundProgress || (unitProgress.unitTest && unitProgress.unitTest.completed)) {
        unitsAttemptedOrGraded++;
      }
      if (unitProgress.overallCompletion >= 100) { // Assuming 100% means fully mastered including test
        completedUnitsCount++;
      }
    }
  });

  return {
    totalUnits: courseUnits.length,
    completedUnits: completedUnitsCount,
    // Average completion considers all units, even those not started (0% for them)
    overallAverageCompletion: courseUnits.length > 0 ? totalCompletionSum / courseUnits.length : 0,
  };
};


export const getAllStudentsProgressData = (): AllStudentsProgress => {
  Object.values(mockStudentProgress).forEach(studentUnits => {
    Object.values(studentUnits).forEach(unitProg => {
      calculateOverallUnitCompletion(unitProg);
    });
  });
  saveStudentProgress(); // Ensure the latest calculations are saved
  return mockStudentProgress;
};
