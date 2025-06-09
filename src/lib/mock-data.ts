
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

// In-memory cache of student progress. This gets updated by saveStudentProgress.
let _cachedStudentProgress: AllStudentsProgress | null = null;

// Function to get the student progress data.
export const getMockStudentProgress = (): AllStudentsProgress => {
  if (typeof window !== 'undefined') {
    const storedProgressJson = localStorage.getItem(STUDENT_PROGRESS_KEY);
    let loadedProgress: AllStudentsProgress | null = null;

    if (storedProgressJson) {
      try {
        loadedProgress = JSON.parse(storedProgressJson);
      } catch (e) {
        console.error("Failed to parse student progress from localStorage, will reinitialize.", e);
        loadedProgress = null; // Treat as if not found, will initialize fresh
      }
    }

    // If no stored progress or parsing failed, initialize fresh for all students
    if (!loadedProgress) {
      console.log("No valid progress found in localStorage, initializing fresh for all students.");
      _cachedStudentProgress = initializeAllStudentProgress();
      localStorage.setItem(STUDENT_PROGRESS_KEY, JSON.stringify(_cachedStudentProgress));
      return _cachedStudentProgress;
    }

    // If we have loaded progress, ensure it's up-to-date with current students and units
    // This will add entries for new students or new units for existing students without wiping old data.
    let modified = false;
    mockStudents.forEach(student => {
      if (!loadedProgress![student.id]) {
        loadedProgress![student.id] = {}; // Initialize progress object for a new student
        modified = true;
      }
      courseUnits.forEach(unit => {
        if (!loadedProgress![student.id][unit.id]) {
          // If a student from mockStudents doesn't have this unit in loadedProgress, add it.
          loadedProgress![student.id][unit.id] = createInitialUnitProgress(unit.id);
          modified = true;
        } else {
          // Optional: Could also check if existing unit progress has all rounds, etc.
          // For now, just ensuring the unit entry exists.
        }
      });
    });

    if (modified) {
      console.log("Student progress structure updated with new students/units and saved to localStorage.");
      localStorage.setItem(STUDENT_PROGRESS_KEY, JSON.stringify(loadedProgress));
    }
    
    _cachedStudentProgress = loadedProgress;
    return _cachedStudentProgress;

  }
  
  // For non-browser (SSR) or if _cachedStudentProgress is somehow still null
  if (!_cachedStudentProgress) {
      _cachedStudentProgress = initializeAllStudentProgress(); 
  }
  return _cachedStudentProgress;
};


// Function to save the student progress data.
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

