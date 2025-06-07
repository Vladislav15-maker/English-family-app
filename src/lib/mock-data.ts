import type { User, Student, Teacher, Message, AllStudentsProgress, StudentUnitProgress, StudentRoundProgress, StudentAttendance, UnitTest } from '@/types';
import { courseUnits } from './course-data';

export interface MockUserCredentials {
  username: string;
  password?: string;
}

export const mockUsers: (Student | Teacher)[] = [
  { id: 'teacher-vlad', username: 'Vladislav', password: 'Vladislav15', name: 'Vladislav Yermilov', role: 'teacher' },
  { id: 'student-oksana', username: 'Oksana', password: 'Oksana25', name: 'Oksana Yurchenko', role: 'student', hintsRemaining: 5 },
  { id: 'student-alex', username: 'Alexander', password: 'Alexander23', name: 'Alexander Yermilov', role: 'student', hintsRemaining: 5 },
];

export const mockStudents: Student[] = mockUsers.filter(u => u.role === 'student') as Student[];
export const mockTeacher: Teacher = mockUsers.find(u => u.role === 'teacher') as Teacher;

const STUDENT_PROGRESS_KEY = 'englishFamilyStudentProgress';
const MESSAGES_KEY = 'englishFamilyMessages';

const createInitialRoundProgress = (roundId: string, totalQuestions: number): StudentRoundProgress => ({
  roundId,
  completed: false,
  score: 0,
  correctAnswers: 0,
  totalQuestions,
  attempts: [],
});

const createInitialUnitProgress = (unitId: string): StudentUnitProgress => {
  const unit = courseUnits.find(u => u.id === unitId);
  if (!unit) throw new Error(`Unit not found for initial progress: ${unitId}`);

  const vocabRounds: Record<string, StudentRoundProgress> = {};
  unit.vocabulary.forEach(vr => {
    vocabRounds[vr.id] = createInitialRoundProgress(vr.id, vr.words.length);
  });

  const grammarRounds: Record<string, StudentRoundProgress> = {};
  unit.grammar.forEach(gr => {
    grammarRounds[gr.id] = createInitialRoundProgress(gr.id, gr.questions.length);
  });
  
  return {
    unitId,
    vocabRounds,
    grammarRounds,
    unitTest: undefined, 
    overallCompletion: 0,
  };
};

// Initialize progress for all students
const initializeStudentProgress = (): AllStudentsProgress => {
  const progress: AllStudentsProgress = {};
  mockStudents.forEach(student => {
    progress[student.id] = {};
    courseUnits.forEach(unit => {
      progress[student.id][unit.id] = createInitialUnitProgress(unit.id);
    });
  });
  return progress;
};

// Load student progress from localStorage or initialize if not present
export let mockStudentProgress: AllStudentsProgress;
if (typeof window !== 'undefined') {
  const storedProgress = localStorage.getItem(STUDENT_PROGRESS_KEY);
  if (storedProgress) {
    try {
      mockStudentProgress = JSON.parse(storedProgress);
      // Basic validation: check if all students and units are present, reinitialize if structure seems off
      let needsReinit = false;
      if (Object.keys(mockStudentProgress).length !== mockStudents.length) needsReinit = true;
      mockStudents.forEach(student => {
        if (!mockStudentProgress[student.id]) needsReinit = true;
        else {
          courseUnits.forEach(unit => {
            if (!mockStudentProgress[student.id][unit.id]) needsReinit = true;
          });
        }
      });
      if(needsReinit) {
        console.warn("Student progress structure in localStorage is outdated or incomplete. Reinitializing.");
        mockStudentProgress = initializeStudentProgress();
        localStorage.setItem(STUDENT_PROGRESS_KEY, JSON.stringify(mockStudentProgress));
      }
    } catch (e) {
      console.error("Failed to parse student progress from localStorage, reinitializing.", e);
      mockStudentProgress = initializeStudentProgress();
      localStorage.setItem(STUDENT_PROGRESS_KEY, JSON.stringify(mockStudentProgress));
    }
  } else {
    mockStudentProgress = initializeStudentProgress();
    localStorage.setItem(STUDENT_PROGRESS_KEY, JSON.stringify(mockStudentProgress));
  }
} else {
  // Fallback for server-side or environments without window (should ideally not happen for this logic)
  mockStudentProgress = initializeStudentProgress();
}


export const saveStudentProgress = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STUDENT_PROGRESS_KEY, JSON.stringify(mockStudentProgress));
  }
};

// Load messages from localStorage or initialize as empty array
export let mockMessages: Message[];
if (typeof window !== 'undefined') {
  const storedMessages = localStorage.getItem(MESSAGES_KEY);
  if (storedMessages) {
    try {
      mockMessages = JSON.parse(storedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp) // Ensure timestamp is a Date object
      }));
    } catch (e) {
      console.error("Failed to parse messages from localStorage, initializing as empty.", e);
      mockMessages = [];
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(mockMessages));
    }
  } else {
    mockMessages = [];
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(mockMessages));
  }
} else {
  mockMessages = [];
}

export const saveMessages = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(mockMessages));
  }
};


export const getMockMessages = (userId: string, userRole: 'student' | 'teacher'): Message[] => {
  // Ensure mockMessages is loaded correctly before filtering
  let currentMessages: Message[] = [];
  if (typeof window !== 'undefined') {
    const storedMessages = localStorage.getItem(MESSAGES_KEY);
    if (storedMessages) {
      try {
        currentMessages = JSON.parse(storedMessages).map((msg: any) => ({
         ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch { /* ignore */ }
    }
  } else {
    currentMessages = [...mockMessages]; // Use in-memory if no window
  }

  if (userRole === 'teacher') {
    return currentMessages.filter(msg => msg.recipientId === userId || (msg.senderId === userId && msg.recipientId === 'all_students') || msg.senderId === userId);
  }
  return currentMessages.filter(msg => msg.recipientId === userId || msg.senderId === userId || msg.recipientId === 'all_students');
};


export const mockStudentAttendance: StudentAttendance[] = mockStudents.map(student => ({
  studentId: student.id,
  name: student.name,
  attendance: {} 
}));

// Unit tests are now offline. This array might be used by students to see their scores for "conceptual" tests.
// For teacher management, it's not used for online execution anymore.
export let mockUnitTests: UnitTest[] = []; 

// To store students in a waiting room for a specific test (No longer primary mechanism)
export let mockWaitingRoomParticipants: Record<string, { studentId: string; studentName: string; avatarFallback: string }[]> = {};
