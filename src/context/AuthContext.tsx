"use client";

import type { User, Student, Teacher, SignUpCredentials, LoginCredentials } from '@/types';
import type { Profile } from '@/types/supabase';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session, User as SupabaseUser, Subscription } from '@supabase/supabase-js';
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

          if (error && error.code !== 'PGRST116') { 
            console.error('[AuthContext] Error fetching profile:', error);
            setUser(null);
          } else if (profile) {
            const appUser: User = {
              id: supabaseAuthUser.id,
              email: supabaseAuthUser.email, // email still stored on user object from auth
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
             // Profile might not exist yet if user just signed up and trigger hasn't run / finished
             // Or if invited user hasn't set password and confirmed.
             console.warn("[AuthContext] Profile not found for user (or not yet created):", supabaseAuthUser.id, "Event:", event);
             if (event !== 'USER_DELETED' && event !== 'SIGNED_OUT') {
                // Minimal user object if profile not ready, to prevent immediate logout if just signed up.
                // This is tricky because we need role for redirection.
                // For now, let's clear user if profile is missing, and rely on login flow to fetch it.
                // If it's a fresh sign up, the profile will be created by the trigger.
                // If it's a login, the profile MUST exist.
             } else {
                setUser(null);
             }
          }
        } else { 
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router, pathname]);


  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);

    // 1. Fetch profile by username to get the email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', credentials.username)
      .single();

    if (profileError || !profile || !profile.email) {
      console.error('Login error - profile not found for username or no email associated:', credentials.username, profileError);
      setIsLoading(false);
      return { success: false, error: { message: 'Invalid username or password.' } };
    }

    // 2. Use the fetched email to sign in with password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email, // Use the email found from the profile
      password: credentials.password!,
    });
    
    setIsLoading(false);
    if (signInError) {
      console.error('Login error - signInWithPassword failed:', signInError);
      // Supabase often returns a generic "Invalid login credentials" for security.
      return { success: false, error: { message: 'Invalid username or password.' } };
    }
    // onAuthStateChange will handle setting the user and redirecting
    return { success: true };
  };

  const signUp = async (credentials: SignUpCredentials) => {
    setIsLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: credentials.email, // Sign up still requires email for Supabase Auth user
      password: credentials.password!,
      options: {
        data: { 
          username: credentials.username,
          name: credentials.name,
          role: credentials.role,
          // hints_remaining will be set by the SQL trigger if role is student
        },
      },
    });
    setIsLoading(false);
    if (error) {
      console.error('Sign up error:', error);
      return { success: false, error };
    }
    // Check if user already exists (identities array is empty in this case for email/password)
    if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        // This case means the user likely exists but might be unconfirmed.
        // Supabase would have resent a confirmation email if "Confirm email" is enabled.
        return { success: true, error: { message: "User already exists or requires confirmation. If unconfirmed, a new confirmation email may have been sent." } };
    }
    // On successful new user creation, onAuthStateChange will pick them up.
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
