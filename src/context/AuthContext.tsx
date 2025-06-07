"use client";

import type { User, Student, Teacher } from '@/types';
import { mockUsers, type MockUserCredentials } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: MockUserCredentials) => Promise<boolean>;
  logout: () => void;
  isStudent: () => boolean;
  isTeacher: () => boolean;
  studentData: Student | null;
  teacherData: Teacher | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for persisted user session (e.g., from localStorage)
    const storedUser = localStorage.getItem('linguaFamiliaUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user, removing corrupted data:", error);
        localStorage.removeItem('linguaFamiliaUser');
        setUser(null); // Ensure user state is cleared if parsing fails
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: MockUserCredentials): Promise<boolean> => {
    setIsLoading(true);
    const foundUser = mockUsers.find(
      u => u.username === credentials.username && u.password === credentials.password
    );

    if (foundUser) {
      // Omit password before storing/setting state
      const { password, ...userToStore } = foundUser;
      setUser(userToStore);
      localStorage.setItem('linguaFamiliaUser', JSON.stringify(userToStore));
      setIsLoading(false);
      // Redirect based on role after successful login
      if (userToStore.role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      return true;
    }
    setUser(null);
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('linguaFamiliaUser');
    router.push('/login');
  };
  
  const isStudent = () => user?.role === 'student';
  const isTeacher = () => user?.role === 'teacher';

  const studentData = isStudent() ? (user as Student) : null;
  const teacherData = isTeacher() ? (user as Teacher) : null;


  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isStudent, isTeacher, studentData, teacherData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

