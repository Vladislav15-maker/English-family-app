"use client";

import type { User, Student, Teacher, SignUpCredentials, LoginCredentials } from '@/types';
import type { Profile } from '@/types/supabase';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session, User as SupabaseUser, Subscription } from '@supabase/supabase-js'; // Added Subscription
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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // console.log("[AuthContext] useEffect for onAuthStateChange triggered. Pathname:", pathname);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // console.log("[AuthContext] onAuthStateChange fired. Event:", event, "Session:", session);
        setIsLoading(true);
        const supabaseAuthUser = session?.user ?? null;

        if (supabaseAuthUser) {
          // console.log("[AuthContext] Supabase user found:", supabaseAuthUser.id);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseAuthUser.id)
            .single();

          if (error && error.code !== 'PGRST116') { 
            console.error('[AuthContext] Error fetching profile:', error);
            setUser(null);
          } else if (profile) {
            // console.log("[AuthContext] Profile found:", profile);
            const appUser: User = {
              id: supabaseAuthUser.id,
              email: supabaseAuthUser.email,
              username: profile.username || '',
              name: profile.name || '',
              role: profile.role as 'student' | 'teacher',
              ...(profile.role === 'student' && { hintsRemaining: profile.hints_remaining ?? 0 }),
            };
            setUser(appUser);
            
            if (pathname === '/login' || pathname === '/') {
                 if (appUser.role === 'teacher') {
                    router.replace('/teacher/dashboard');
                } else {
                    router.replace('/student/dashboard');
                }
            }
          } else {
             console.warn("[AuthContext] Profile not found for user:", supabaseAuthUser.id, "Event:", event);
             if (event !== 'USER_DELETED') {
                // Potentially set a minimal user or wait.
             } else {
                setUser(null);
             }
          }
        } else { 
          // console.log("[AuthContext] No Supabase user in session.");
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Ensure authListener and its data.subscription exist before trying to unsubscribe
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
        // console.log("[AuthContext] Unsubscribed from onAuthStateChange.");
      } else {
        // console.warn("[AuthContext] Could not unsubscribe, authListener or subscription missing.");
      }
    };
  }, [router, pathname]);


  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password!,
    });
    setIsLoading(false);
    if (error) {
      console.error('Login error:', error);
      return { success: false, error };
    }
    return { success: true };
  };

  const signUp = async (credentials: SignUpCredentials) => {
    setIsLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password!,
      options: {
        data: { 
          username: credentials.username,
          name: credentials.name,
          role: credentials.role,
        },
      },
    });
    setIsLoading(false);
    if (error) {
      console.error('Sign up error:', error);
      return { success: false, error };
    }
    if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        return { success: true, error: { message: "User already exists. If unconfirmed, a new confirmation email has been sent." } };
    }
    return { success: true };
  };


  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null); 
    router.push('/login'); 
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

