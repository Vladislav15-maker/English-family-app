
"use client";

import type { User, Student, Teacher, SignUpCredentials, LoginCredentials } from '@/types';
// Removed Supabase specific imports: Profile, supabase, AuthChangeEvent, Session, SupabaseUser, Subscription
import { mockUsers } from '@/lib/mock-data'; // Using mock users for authentication
import { useRouter, usePathname } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: any }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  isStudent: () => boolean;
  isTeacher: () => boolean;
  studentData: Student | null;
  teacherData: Teacher | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Will be set to false quickly
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // No Supabase auth listener needed.
    // If we wanted to persist mock login across reloads (e.g. via localStorage),
    // we'd do that here. For now, simple logout on refresh.
    setIsLoading(false); // App is ready immediately
     // Check if user is not logged in and not on login page, redirect to login
    if (!user && pathname !== '/login') {
        // router.replace('/login'); // This might be too aggressive, let pages handle their own redirects if needed
    }

  }, [user, pathname, router]);


  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    console.log("[AuthContext - Mock] Attempting login with username:", credentials.username);

    const foundUser = mockUsers.find(
      (u) => u.username === credentials.username && u.password === credentials.password
    );

    if (foundUser) {
      console.log("[AuthContext - Mock] User found:", foundUser.name, "Role:", foundUser.role);
      setUser(foundUser);
      setIsLoading(false);
      if (foundUser.role === 'teacher') {
        router.replace('/teacher/dashboard');
      } else {
        router.replace('/student/dashboard');
      }
      return { success: true };
    } else {
      console.log("[AuthContext - Mock] User not found or password incorrect for username:", credentials.username);
      setUser(null);
      setIsLoading(false);
      return { success: false, error: { message: "Неверный логин или пароль." } };
    }
  };

  const signUp = async (credentials: SignUpCredentials) => {
    // Sign up via UI is effectively disabled as per previous requests.
    // If it were enabled, it would add to mockUsers (not persistent).
    console.warn("[AuthContext - Mock] signUp called, but UI sign up should be disabled.");
    return { success: false, error: { message: "Регистрация отключена." } };
  };


  const logout = async () => {
    setIsLoading(true);
    setUser(null);
    router.replace('/login');
    setIsLoading(false);
  };

  const isStudent = () => user?.role === 'student';
  const isTeacher = () => user?.role === 'teacher';

  const studentData = isStudent() ? (user as Student) : null;
  const teacherData = isTeacher() ? (user as Teacher) : null;


  return (
    <AuthContext.Provider value={{ user, isLoading, login, signUp, logout, isStudent, isTeacher, studentData, teacherData }}>
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

