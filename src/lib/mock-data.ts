
import type { User, Student, Teacher, Message, AllStudentsProgress, StudentUnitProgress, StudentRoundProgress, StudentAttendance, AttendanceStatus, UnitTest, StudentAnswer } from '@/types';
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
  if (!unit) throw new Error(`Unit not found: ${unitId}`);

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
    overallCompletion: 0,
  };
};

export const mockUnitTests: UnitTest[] = [
    {
        id: 'test-unit-1-general',
        unitId: 'unit-1',
        title: 'Unit 1 General Test',
        teacherId: 'teacher-vlad',
        status: 'active', 
        durationMinutes: 30,
        questions: [
            ...(courseUnits.find(u => u.id === 'unit-1')?.vocabulary[0].words.slice(0,2) || []),
            ...(courseUnits.find(u => u.id === 'unit-1')?.grammar[0].questions.slice(0,3) || [])
        ],
        assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 
    },
    {
        id: 'test-unit-2-vocab',
        unitId: 'unit-2',
        title: 'Unit 2 Vocabulary Check',
        teacherId: 'teacher-vlad',
        status: 'active', 
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
        title: 'Unit 1 Review (Completed by Oksana)',
        teacherId: 'teacher-vlad',
        status: 'completed', 
        durationMinutes: 25,
        questions: [ /* ... some questions ... */ ],
        assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    }
];


export const mockStudentProgress: AllStudentsProgress = {
  'student-oksana': {
    'unit-1': (() => {
        const progress = createInitialUnitProgress('unit-1');
        progress.vocabRounds['unit-1-vocab-1'] = { roundId: 'unit-1-vocab-1', completed: true, score: 80, correctAnswers: 4, totalQuestions: 5, attempts: [{ answers: [], score: 80, timestamp: new Date() }] };
        progress.grammarRounds['unit-1-grammar-1'] = { roundId: 'unit-1-grammar-1', completed: true, score: 60, correctAnswers: 3, totalQuestions: 5, attempts: [{ answers: [], score: 60, timestamp: new Date() }] };
        
        const completedTest = mockUnitTests.find(t => t.id === 'test-unit-1-completed-by-oksana');
        if (completedTest) {
            const correctTestAnswers = Math.floor(completedTest.questions.length * 0.92); 
            const testAnswers: StudentAnswer[] = completedTest.questions.map((q, idx) => ({
                itemId: q.id,
                studentAnswer: "mock answer",
                isCorrect: idx < correctTestAnswers
            }));
            progress.unitTest = {
                roundId: completedTest.id, 
                completed: true,
                score: 92,
                correctAnswers: correctTestAnswers,
                totalQuestions: completedTest.questions.length,
                attempts: [{ answers: testAnswers, score: 92, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000) }] 
            };
        }
        
        let totalScore = progress.vocabRounds['unit-1-vocab-1'].score + progress.grammarRounds['unit-1-grammar-1'].score;
        let totalRoundsCount = Object.keys(progress.vocabRounds).length + Object.keys(progress.grammarRounds).length;
        
        progress.overallCompletion = totalRoundsCount > 0 ? totalScore / totalRoundsCount : 0;
        return progress;
    })(),
    'unit-2': createInitialUnitProgress('unit-2'), 
  },
  'student-alex': {
    'unit-1': createInitialUnitProgress('unit-1'), 
  }
};

mockStudents.forEach(student => {
  if (!mockStudentProgress[student.id]) {
    mockStudentProgress[student.id] = {};
  }
  courseUnits.forEach(unit => {
    if (!mockStudentProgress[student.id][unit.id]) {
      mockStudentProgress[student.id][unit.id] = createInitialUnitProgress(unit.id);
    }
  });
});


export const mockMessages: Message[] = [
  { 
    id: 'msg1', 
    senderId: 'teacher-vlad', 
    senderName: 'Vladislav Yermilov',
    recipientId: 'student-oksana', 
    content: 'Great job on the first vocabulary round, Oksana! Keep it up.', 
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), 
    isRead: true 
  },
  { 
    id: 'msg2', 
    senderId: 'teacher-vlad', 
    senderName: 'Vladislav Yermilov',
    recipientId: 'all_students', 
    content: 'Reminder: Unit 2 will unlock tomorrow at 6 PM. Prepare for new vocabulary on Family!', 
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), 
    isRead: false
  },
  { 
    id: 'msg3', 
    senderId: 'student-alex', 
    senderName: 'Alexander Yermilov',
    recipientId: 'teacher-vlad', 
    content: 'I have a question about the "to be" verb in Unit 1, can we discuss it?', 
    timestamp: new Date(Date.now() - 30 * 60 * 1000), 
    isRead: false 
  },
];

export const getMockMessages = (userId: string, userRole: 'student' | 'teacher'): Message[] => {
  if (userRole === 'teacher') {
    return mockMessages.filter(msg => msg.recipientId === userId || msg.senderId === userId || msg.recipientId === 'all_students');
  }
  return mockMessages.filter(msg => msg.recipientId === userId || msg.senderId === userId || msg.recipientId === 'all_students');
};


export const mockStudentAttendance: StudentAttendance[] = mockStudents.map(student => ({
  studentId: student.id,
  name: student.name,
  attendance: {}
}));

export const mockWaitingRoomParticipants: Record<string, { studentId: string; studentName: string; avatarFallback: string }[]> = {
    'test-unit-1-general': [
        { studentId: 'student-oksana', studentName: 'Oksana Yurchenko', avatarFallback: 'OY' },
        { studentId: 'student-alex', studentName: 'Alexander Yermilov', avatarFallback: 'AY' },
    ],
    'test-unit-2-vocab': [
        { studentId: 'student-oksana', studentName: 'Oksana Yurchenko', avatarFallback: 'OY' },
    ]
};

    
