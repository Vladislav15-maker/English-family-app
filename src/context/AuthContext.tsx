"use client";

import type { User, Student, Teacher, SignUpCredentials, LoginCredentials } from '@/types';
import type { Profile } from '@/types/supabase';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
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
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setIsLoading(true);
        const supabaseAuthUser = session?.user ?? null;

        if (supabaseAuthUser) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseAuthUser.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116: "Searched for one object, but found 0 rows"
            console.error('Error fetching profile:', error);
            setUser(null); // Or handle more gracefully
          } else if (profile) {
            const appUser: User = {
              id: supabaseAuthUser.id,
              email: supabaseAuthUser.email,
              username: profile.username || '',
              name: profile.name || '',
              role: profile.role as 'student' | 'teacher',
              ...(profile.role === 'student' && { hintsRemaining: profile.hints_remaining ?? 0 }),
            };
            setUser(appUser);
            
            // Redirect after user is set
            if (pathname === '/login' || pathname === '/') {
                 if (appUser.role === 'teacher') {
                    router.replace('/teacher/dashboard');
                } else {
                    router.replace('/student/dashboard');
                }
            }

          } else {
             // Profile might not exist yet if user just signed up and trigger is running
             // Or if email confirmation is pending.
             // For now, set a minimal user or null. Consider a state for "profile pending".
             console.warn("Profile not found for user:", supabaseAuthUser.id, "Event:", event);
             // If it's a new SIGNED_IN event after sign up, profile might appear shortly.
             // We might want to delay setting user to null or implement a retry.
             // For now, if it's not a USER_DELETED event, keep previous user or set a basic one.
             if (event !== 'USER_DELETED') {
                // If it's a fresh login/signup, and profile is missing, this is an issue.
                // The trigger should have created it.
                // Let's assume for now the trigger works and the profile will be there.
                // If after a short delay profile is still not there, then it's an issue.
             } else {
                setUser(null);
             }
          }
        } else { // No Supabase user
          setUser(null);
          if (!['/login'].includes(pathname) && !pathname.startsWith('/_next/')) { // Avoid redirect loops or static assets
            // router.replace('/login'); // Let AppLayout handle this
          }
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
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
    // onAuthStateChange will handle success and profile fetching
    return { success: true };
  };

  const signUp = async (credentials: SignUpCredentials) => {
    setIsLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password!,
      options: {
        data: { // This data is passed to raw_user_meta_data for the trigger
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
        // This can happen if "Confirm email" is enabled in Supabase project settings
        // and the user already exists but is not confirmed.
        // Supabase signUp will then resend the confirmation email.
        return { success: true, error: { message: "User already exists. If unconfirmed, a new confirmation email has been sent." } };
    }
    // onAuthStateChange will handle success and profile fetching
    // Note: If email confirmation is enabled, user will be in session but profile creation might be delayed.
    return { success: true };
  };


  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null); // Explicitly clear user state
    router.push('/login'); // Force redirect to login
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
