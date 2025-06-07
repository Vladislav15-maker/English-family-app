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

export let mockUnitTests: UnitTest[] = []; // Initialize as empty for teacher-created tests

// Initialize progress for all students to 0%
export const mockStudentProgress: AllStudentsProgress = {};
mockStudents.forEach(student => {
  mockStudentProgress[student.id] = {};
  courseUnits.forEach(unit => {
    mockStudentProgress[student.id][unit.id] = createInitialUnitProgress(unit.id);
  });
});


export let mockMessages: Message[] = []; 

export const getMockMessages = (userId: string, userRole: 'student' | 'teacher'): Message[] => {
  if (userRole === 'teacher') {
    return mockMessages.filter(msg => msg.recipientId === userId || (msg.senderId === userId && msg.recipientId === 'all_students') || msg.senderId === userId);
  }
  return mockMessages.filter(msg => msg.recipientId === userId || msg.senderId === userId || msg.recipientId === 'all_students');
};


export const mockStudentAttendance: StudentAttendance[] = mockStudents.map(student => ({
  studentId: student.id,
  name: student.name,
  attendance: {} 
}));

// To store students in a waiting room for a specific test
export let mockWaitingRoomParticipants: Record<string, { studentId: string; studentName: string; avatarFallback: string }[]> = {};
