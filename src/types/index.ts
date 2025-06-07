
export interface User {
  id: string;
  username: string;
  name: string;
  role: 'student' | 'teacher';
  password?: string; // Only for mock data, not for client-side state
}

export interface Student extends User {
  role: 'student';
  hintsRemaining: number;
}

export interface Teacher extends User {
  role: 'teacher';
}

export interface Word {
  id: string;
  english: string;
  russian: string;
  transcription: string; // Russian phonetic transcription e.g., "[хай]"
}

export interface VocabRound {
  id: string;
  title: string; // e.g., "Раунд 1"
  words: Word[];
}

export type GrammarQuestionType = 'multiple-choice' | 'fill-in-the-blank' | 'transform';

export interface GrammarQuestion {
  id: string;
  question: string;
  options?: string[]; // For multiple-choice
  correctAnswer: string;
  exampleTransformation?: string; // For transform questions like "I am a teacher. → I am not a teacher."
  questionType: GrammarQuestionType;
}

export interface GrammarRound {
  id: string;
  title: string; // e.g., "Раунд 1: Выбери правильный ответ"
  questions: GrammarQuestion[];
}

export interface Unit {
  id: string;
  title: string; // e.g., "Unit 1"
  unitNumber: number;
  isLocked: boolean;
  unlockDate?: Date; 
  description: string; // e.g., "Greetings"
  imagePlaceholder?: string; // e.g., "greetings people" for data-ai-hint
  vocabulary: VocabRound[];
  grammar: GrammarRound[];
}

export interface StudentAnswer {
  itemId: string; // Word ID or Question ID
  studentAnswer: string;
  isCorrect: boolean;
}

export interface StudentRoundAttempt {
  answers: StudentAnswer[];
  score: number; // percentage
  timestamp: Date;
}
export interface StudentRoundProgress {
  roundId: string; // Corresponds to VocabRound.id, GrammarRound.id, or UnitTest.id
  completed: boolean;
  score: number; // percentage 0-100, highest score
  correctAnswers: number;
  totalQuestions: number;
  attempts: StudentRoundAttempt[];
}

export interface StudentUnitProgress {
  unitId: string;
  vocabRounds: Record<string, StudentRoundProgress>; // key is roundId
  grammarRounds: Record<string, StudentRoundProgress>; // key is roundId
  unitTest?: StudentRoundProgress; // Stores result of a UnitTest, key is UnitTest.id
  overallCompletion: number; // Weighted average or simple average
}

export type AllStudentsProgress = Record<string, Record<string, StudentUnitProgress>>;


export interface Message {
  id: string;
  senderId: string; 
  senderName: string;
  recipientId: string; 
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | null; 

export interface DailyAttendance {
  date: string; 
  status: AttendanceStatus;
}
export interface StudentAttendance {
  studentId: string;
  name: string; 
  attendance: Record<string, AttendanceStatus>; 
}


export interface UnitTest {
  id: string; // Unique ID for the test itself
  unitId: string; // ID of the unit this test belongs to
  title: string;
  teacherId: string;
  status: 'pending' | 'active' | 'completed'; // 'completed' means teacher has marked it as finished/graded, not student submission
  durationMinutes: number;
  questions: (Word | GrammarQuestion)[]; 
  startTime?: Date; // Teacher starts the test for students
  endTime?: Date; // Teacher ends the test availability
  assignedDate?: Date; // When the test was created/scheduled
  forStudentId?: string; 
  forGroupId?: string; 
}

// StudentTestResult is essentially StudentRoundProgress but tied to a UnitTest.id
// It's stored in StudentUnitProgress.unitTest where unitTest.roundId === UnitTest.id

export interface PracticeSessionState {
  currentQuestionIndex: number;
  userAnswers: Record<string, string>; // key is word.id or question.id
  // showResults: boolean; // Replaced by mode on the page
  score: number;
  currentRoundData?: VocabRound | GrammarRound; // May not be needed if round data is passed directly
  hintsUsedThisSession: number;
}

export interface StudentData {
  id: string; 
  hintsRemaining: number;
  progress: Record<string, StudentUnitProgress>; 
  messages: Message[];
  activeTestId?: string;
}

export interface TeacherData {
  id: string; 
  messages: Message[];
}

  