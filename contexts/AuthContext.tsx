import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'student' | 'professor' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  fullName: string;
  // Student specific fields
  collegeId?: string;
  course?: string;
  // Professor specific fields
  department?: string;
  professorId?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // For development, return null instead of throwing
      return null;
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const profileData: UserProfile = {
        uid: user.uid,
        email,
        role: userData.role || 'student',
        status: 'pending',
        fullName: userData.fullName || '',
        collegeId: userData.collegeId,
        course: userData.course,
        department: userData.department,
        professorId: userData.professorId,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), profileData);
      
      // Sign out immediately after registration (user needs admin approval)
      await signOut(auth);
      
    } catch (error) {
      console.error('Error during sign up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const profile = await fetchUserProfile(user.uid);
      
      if (!profile) {
        throw new Error('User profile not found');
      }
      
      if (profile.status !== 'approved') {
        await signOut(auth);
        throw new Error('Your account is pending approval from admin');
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Error during sign in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          const profile = await fetchUserProfile(user.uid);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    logout,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
