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

export let mockUnitTests: UnitTest[] = [ // Changed to let
    {
        id: 'test-unit-1-general',
        unitId: 'unit-1',
        title: 'Unit 1 General Test (Active Demo)',
        teacherId: 'teacher-vlad',
        status: 'active', // Set to active for easier testing of student notification
        durationMinutes: 30,
        questions: [
            ...(courseUnits.find(u => u.id === 'unit-1')?.vocabulary[0].words.slice(0,2) || []),
            ...(courseUnits.find(u => u.id === 'unit-1')?.grammar[0].questions.slice(0,3) || [])
        ],
        assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 
        startTime: new Date(Date.now() - 5 * 60 * 1000), // Started 5 mins ago
    },
    {
        id: 'test-unit-2-vocab',
        unitId: 'unit-2',
        title: 'Unit 2 Vocabulary Check',
        teacherId: 'teacher-vlad',
        status: 'pending', 
        durationMinutes: 15,
        questions: [
             ...(courseUnits.find(u => u.id === 'unit-2')?.vocabulary[0].words || [])
        ],
        assignedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 
    },
    {
        id: 'test-unit-3-grammar',
        unitId: 'unit-3',
        title: 'Unit 3 Grammar Focus',
        teacherId: 'teacher-vlad',
        status: 'pending', 
        durationMinutes: 20,
        questions: [
            ...(courseUnits.find(u => u.id === 'unit-3')?.grammar[0].questions || [])
        ],
        assignedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 
    },
    {
        id: 'test-unit-1-completed-by-oksana', 
        unitId: 'unit-1',
        title: 'Unit 1 Review (Example for Results)', 
        teacherId: 'teacher-vlad',
        status: 'completed', // Example of a teacher-completed test
        durationMinutes: 25,
        questions: [ /* Can be empty or populated */ ], 
        assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    }
];

// Initialize progress for all students to 0%
export const mockStudentProgress: AllStudentsProgress = {};
mockStudents.forEach(student => {
  mockStudentProgress[student.id] = {};
  courseUnits.forEach(unit => {
    mockStudentProgress[student.id][unit.id] = createInitialUnitProgress(unit.id);
  });
  
  // Simulate Oksana having completed the 'test-unit-1-completed-by-oksana'
  if (student.id === 'student-oksana') {
    const unit1Progress = mockStudentProgress[student.id]['unit-1'];
    if (unit1Progress) {
      const testResultForOksana: StudentRoundProgress = {
        roundId: 'test-unit-1-completed-by-oksana',
        completed: true,
        score: 85, // Example score
        correctAnswers: 4, // Example
        totalQuestions: 5, // Example
        attempts: [{
          answers: [/* mock answers or leave empty */],
          score: 85,
          timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 10 * 60 * 1000) // 10 mins before teacher marked as completed
        }]
      };
      unit1Progress.unitTest = testResultForOksana;
    }
  }
});


export let mockMessages: Message[] = []; 

export const getMockMessages = (userId: string, userRole: 'student' | 'teacher'): Message[] => {
  if (userRole === 'teacher') {
    // Teachers see messages sent to them and announcements they made
    return mockMessages.filter(msg => msg.recipientId === userId || (msg.senderId === userId && msg.recipientId === 'all_students') || msg.senderId === userId);
  }
  // Students see messages sent to them and announcements
  return mockMessages.filter(msg => msg.recipientId === userId || msg.senderId === userId || msg.recipientId === 'all_students');
};


export const mockStudentAttendance: StudentAttendance[] = mockStudents.map(student => ({
  studentId: student.id,
  name: student.name,
  attendance: {} 
}));

export const mockWaitingRoomParticipants: Record<string, { studentId: string; studentName: string; avatarFallback: string }[]> = {};
