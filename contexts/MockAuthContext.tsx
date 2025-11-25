import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'student' | 'professor' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  fullName: string;
  collegeId?: string;
  course?: string;
  department?: string;
  professorId?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: UserProfile | null;
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

// Mock admin user
const ADMIN_USER: UserProfile = {
  uid: 'admin-001',
  email: 'asthikshetty9999@gmail.com',
  role: 'admin',
  status: 'approved',
  fullName: 'Admin User',
  createdAt: new Date(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    // Mock signup - just simulate success
    console.log('Mock signup:', { email, userData });
    alert('Registration successful! Please login with admin credentials to approve your account.');
  };

  const signIn = async (email: string, password: string) => {
    // Check for admin credentials
    if (email === 'asthikshetty9999@gmail.com' && password === 'Asthik@9901') {
      setUser(ADMIN_USER);
      setUserProfile(ADMIN_USER);
      return;
    }
    
    // Check for demo users
    if (email === 'student@demo.com' && password === 'student123') {
      const studentUser: UserProfile = {
        uid: 'student-001',
        email: 'student@demo.com',
        role: 'student',
        status: 'approved',
        fullName: 'Demo Student',
        collegeId: 'STU001',
        course: 'Computer Science',
        createdAt: new Date(),
      };
      setUser(studentUser);
      setUserProfile(studentUser);
      return;
    }
    
    if (email === 'professor@demo.com' && password === 'professor123') {
      const professorUser: UserProfile = {
        uid: 'professor-001',
        email: 'professor@demo.com',
        role: 'professor',
        status: 'approved',
        fullName: 'Demo Professor',
        department: 'Computer Science',
        professorId: 'PROF001',
        createdAt: new Date(),
      };
      setUser(professorUser);
      setUserProfile(professorUser);
      return;
    }
    
    throw new Error('Invalid credentials. Use admin: asthikshetty9999@gmail.com / Asthik@9901');
  };

  const logout = async () => {
    setUser(null);
    setUserProfile(null);
  };

  const refreshUserProfile = async () => {
    // Mock refresh
  };

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
