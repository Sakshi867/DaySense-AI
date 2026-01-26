import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '@/integrations/firebase/client';

// --- Types ---

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  created_at: any; // Firestore returns a Timestamp object
  energy_level: number;
  north_star: string | null;
  streak_days: number;
  onboarding_completed: boolean; // CRITICAL: For redirection logic
  notifications_enabled?: boolean;
  daily_checkins_enabled?: boolean;
  task_reminders_enabled?: boolean;
  focus_sessions_enabled?: boolean;
  dark_mode_enabled?: boolean;
  sound_effects_enabled?: boolean;
  auto_sync_theme_enabled?: boolean;
  high_contrast_enabled?: boolean;
  large_text_enabled?: boolean;
  theme_color?: string;
  chronotype?: 'morning' | 'afternoon' | 'evening';
}

export interface UserTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  energy_cost: number;
  estimated_minutes: number;
  priority: 'low' | 'medium' | 'high';
  category: string | null;
  completed: boolean;
  created_at: any;
  updated_at: any;
}

export interface UserAnalytics {
  id: string;
  user_id: string;
  date: any;
  energy_level: number;
  tasks_completed: number;
  focus_time: number;
  flow_time: number;
  recharge_time: number;
  created_at: any;
}

// --- Auth Service ---

export const authService = {
  // Sign up
  signUp: async (email: string, password: string, fullName: string) => {
    await setPersistence(auth, browserSessionPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create initial user profile with onboarding_completed: false
    await profileService.createProfile(user.uid, {
      email: user.email,
      full_name: fullName,
      energy_level: 3,
      streak_days: 0,
      onboarding_completed: false, // Ensures they go to onboarding first
      notifications_enabled: true,
      daily_checkins_enabled: true,
      task_reminders_enabled: true,
      focus_sessions_enabled: false,
      dark_mode_enabled: true,
      sound_effects_enabled: true,
      auto_sync_theme_enabled: true,
      high_contrast_enabled: false,
      large_text_enabled: false,
      theme_color: 'Default'
    });

    return user;
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    await setPersistence(auth, browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Sign out
  signOut: async () => {
    await signOut(auth);
  },

  // Get current user
  getCurrentUser: () => {
    return new Promise<FirebaseUser | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  },

  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};

// --- Profile Service ---

export const profileService = {
  createProfile: async (userId: string, profileData: Partial<UserProfile>) => {
    const profileRef = doc(db, 'profiles', userId);
    const profile = {
      ...profileData,
      id: userId,
      created_at: serverTimestamp(), // Best practice: use server time
      onboarding_completed: profileData.onboarding_completed ?? false
    };

    // Use setDoc with merge: true so we don't accidentally wipe existing data
    await setDoc(profileRef, profile, { merge: true });
    return profile;
  },

  getProfile: async (userId: string) => {
    const profileRef = doc(db, 'profiles', userId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      return { id: profileSnap.id, ...profileSnap.data() } as UserProfile;
    }
    return null;
  },

  updateProfile: async (userId: string, profileData: Partial<UserProfile>) => {
    const profileRef = doc(db, 'profiles', userId);
    await updateDoc(profileRef, profileData);
    return await profileService.getProfile(userId);
  }
};

// --- Tasks Service ---

export const tasksService = {
  createTask: async (userId: string, taskData: Omit<UserTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const taskRef = collection(db, 'tasks');
    const newTask = {
      ...taskData,
      user_id: userId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(taskRef, newTask);
    return { id: docRef.id, ...newTask } as UserTask;
  },

  getUserTasks: async (userId: string) => {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserTask[];
  },

  updateTask: async (taskId: string, taskData: Partial<UserTask>) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { ...taskData, updated_at: serverTimestamp() });
    const updatedDoc = await getDoc(taskRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as UserTask;
  },

  deleteTask: async (taskId: string) => {
    await deleteDoc(doc(db, 'tasks', taskId));
  }
};

// --- Analytics Service ---

export const analyticsService = {
  upsertDailyAnalytics: async (userId: string, analyticsData: Omit<UserAnalytics, 'id' | 'user_id' | 'created_at'>) => {
    const analyticsRef = collection(db, 'analytics');
    const q = query(
      analyticsRef,
      where('user_id', '==', userId),
      where('date', '==', analyticsData.date)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, { ...analyticsData, updated_at: serverTimestamp() });
      return { id: docRef.id, ...analyticsData } as UserAnalytics;
    } else {
      const newAnalytics = {
        ...analyticsData,
        user_id: userId,
        created_at: serverTimestamp()
      };
      const docRef = await addDoc(analyticsRef, newAnalytics);
      return { id: docRef.id, ...newAnalytics } as UserAnalytics;
    }
  },

  getUserAnalytics: async (userId: string) => {
    const q = query(collection(db, 'analytics'), where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserAnalytics[];
  }
};