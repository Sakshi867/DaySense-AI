import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, profileService, UserProfile } from '@/services/firebaseService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOnboardingCompleted: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string, email?: string | null) => {
    try {
      const profile = await profileService.getProfile(uid);
      if (profile) {
        setUser(profile);
      } else {
        // If profile document doesn't exist in Firestore yet
        setUser(null);
      }
    } catch (error: any) {
      console.warn("AuthContext: Firestore is working offline. Using cached data if available.");
      
      // FALLBACK: If we are offline and have NO cached profile, 
      // create a temporary one so the UI doesn't stay blank.
      if (!user) {
        setUser({
          id: uid,
          email: email || '',
          full_name: 'User',
          avatar_url: '',
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          energy_level: 3,
          north_star: '',
          streak_days: 0
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid, firebaseUser.email);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, pass: string, fullName: string) => {
    setLoading(true);
    try {
      const firebaseUser = await authService.signUp(email, pass, fullName);
      if (firebaseUser) await fetchProfile(firebaseUser.uid, email);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const firebaseUser = await authService.signIn(email, pass);
      if (firebaseUser) await fetchProfile(firebaseUser.uid, firebaseUser.email);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const updateUser = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      setUser(prev => prev ? { ...prev, ...data } : null);
      await profileService.updateProfile(user.id, data);
    } catch (error) {
      console.error("Update failed, but local state preserved:", error);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isOnboardingCompleted: !!user?.onboarding_completed,
    signIn,
    signUp,
    signOut,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};