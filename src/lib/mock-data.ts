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

// Helper to create initial progress for a single unit
const createInitialUnitProgress = (unitId: string): StudentUnitProgress => {
  const unit = courseUnits.find(u => u.id === unitId);
  if (!unit) throw new Error(`Unit not found for initial progress: ${unitId}`);

  const vocabRounds: Record<string, StudentRoundProgress> = {};
  unit.vocabulary.forEach(vr => {
    vocabRounds[vr.id] = { roundId: vr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: vr.words.length, attempts: [] };
  });

  const grammarRounds: Record<string, StudentRoundProgress> = {};
  unit.grammar.forEach(gr => {
    grammarRounds[gr.id] = { roundId: gr.id, completed: false, score: 0, correctAnswers: 0, totalQuestions: gr.questions.length, attempts: [] };
  });
  
  return {
    unitId,
    vocabRounds,
    grammarRounds,
    unitTest: undefined, 
    overallCompletion: 0,
  };
};

// Helper to initialize progress for all students
const initializeAllStudentProgress = (): AllStudentsProgress => {
  const progress: AllStudentsProgress = {};
  mockStudents.forEach(student => {
    progress[student.id] = {};
    courseUnits.forEach(unit => {
      progress[student.id][unit.id] = createInitialUnitProgress(unit.id);
    });
  });
  return progress;
};

// Function to initialize progress and store it if not found or invalid
const initializeAndStoreProgress = (): AllStudentsProgress => {
  const progress = initializeAllStudentProgress();
  if (typeof window !== 'undefined') {
    localStorage.setItem(STUDENT_PROGRESS_KEY, JSON.stringify(progress));
  }
  return progress;
};

// In-memory cache of student progress. This gets updated by saveStudentProgress.
let _cachedStudentProgress: AllStudentsProgress | null = null;

// Function to get the student progress data.
// It prioritizes reading from localStorage if on client-side to get the "freshest" data.
export const getMockStudentProgress = (): AllStudentsProgress => {
  if (typeof window !== 'undefined') {
    const storedProgress = localStorage.getItem(STUDENT_PROGRESS_KEY);
    if (storedProgress) {
      try {
        _cachedStudentProgress = JSON.parse(storedProgress);
        // Basic validation: check if all students and units are present, reinitialize if structure seems off
        let needsReinit = false;
        if (!_cachedStudentProgress || Object.keys(_cachedStudentProgress).length === 0) { // Check if empty or null
             needsReinit = true;
        } else {
            mockStudents.forEach(student => {
                if (!_cachedStudentProgress![student.id]) {
                    needsReinit = true;
                } else {
                    courseUnits.forEach(unit => {
                        if (!_cachedStudentProgress![student.id][unit.id]) {
                            needsReinit = true;
                        }
                    });
                }
            });
        }
        if(needsReinit) {
          console.warn("Student progress structure in localStorage is outdated, incomplete, or empty. Reinitializing.");
          _cachedStudentProgress = initializeAndStoreProgress();
        }
        return _cachedStudentProgress!;
      } catch (e) {
        console.error("Failed to parse student progress from localStorage during get, reinitializing.", e);
        _cachedStudentProgress = initializeAndStoreProgress();
        return _cachedStudentProgress;
      }
    } else {
      // If nothing in storage, initialize, store, and return
      _cachedStudentProgress = initializeAndStoreProgress();
      return _cachedStudentProgress;
    }
  }
  // For non-browser (SSR) or if _cachedStudentProgress is somehow still null
  if (!_cachedStudentProgress) {
      _cachedStudentProgress = initializeAllStudentProgress(); // Initialize for SSR or as a last resort
  }
  return _cachedStudentProgress;
};

// Function to save the student progress data.
// It updates both the in-memory cache and localStorage.
export const saveStudentProgress = (updatedProgress: AllStudentsProgress) => {
  _cachedStudentProgress = updatedProgress; // Update the in-memory cache
  if (typeof window !== 'undefined') {
    localStorage.setItem(STUDENT_PROGRESS_KEY, JSON.stringify(updatedProgress));
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
    // Fallback for server-side: use the in-memory mockMessages (which might be empty if not initialized elsewhere for SSR)
    currentMessages = [...mockMessages]; 
  }

  if (userRole === 'teacher') {
    // Teacher sees messages sent to them, or announcements they sent
    return currentMessages.filter(msg => msg.recipientId === userId || (msg.senderId === userId && msg.recipientId === 'all_students'));
  }
  // Student sees messages sent to them, messages they sent, or announcements to all students
  return currentMessages.filter(msg => msg.recipientId === userId || msg.senderId === userId || msg.recipientId === 'all_students');
};


export const mockStudentAttendance: StudentAttendance[] = mockStudents.map(student => ({
  studentId: student.id,
  name: student.name,
  attendance: {} 
}));

export let mockUnitTests: UnitTest[] = []; 

export let mockWaitingRoomParticipants: Record<string, { studentId: string; studentName: string; avatarFallback: string }[]> = {};
