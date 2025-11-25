import React, { createContext, useContext, useEffect, useState } from 'react';
import { mongoService, UserProfile } from '../services/MongoDBService';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true);
      console.log('Attempting to sign up user with role:', userData.role);
      await mongoService.signUp(email, password, userData);
      // Note: Signup does not provide a token, user needs to login after approval
      console.log('Signup successful');
    } catch (error: any) {
      console.error('Signup error in AuthProvider:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Updated signIn function with admin approval check and better error handling
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔑 Attempting to sign in user:', email);
      const result = await mongoService.signIn(email, password);

      // After successful signin, get user profile
      console.log('👤 Fetching user profile...');
      const profile = await mongoService.getCurrentUser();
      if (!profile) {
        throw new Error(
          'Login succeeded but failed to retrieve user profile. Please check your network connection and server status.'
        );
      }

      // 🚫 Additional validation for admin users
      if (profile.role === 'admin' && profile.status !== 'approved') {
        await mongoService.logout();
        throw new Error('Admin account is not approved. Please contact system administrator.');
      }

      setUser(profile);
      setUserProfile(profile);
      console.log('✅ Signin successful for user:', profile.email, 'with role:', profile.role);
      return result;
    } catch (error: any) {
      console.error('💥 Signin error in AuthProvider:', error);
      // Provide more specific error messages to the UI
      if (error.message.includes('connect') || error.message.includes('network') || error.message.includes('server')) {
        throw new Error('Unable to connect to the server. Please check your internet connection and ensure the backend server is running on port 3001.\n\n' +
          'Troubleshooting tips:\n' +
          '• Make sure the server is running (npm start)\n' +
          '• If using Android emulator, try using 10.0.2.2 as the host\n' +
          '• If using a physical device, ensure both devices are on the same network\n' +
          '• Check your firewall settings');
      } else {
        throw error; // Re-throw other errors
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await mongoService.logout();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const profile = await mongoService.getCurrentUser();
      if (profile) {
        setUser(profile);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Refresh profile error:', error);
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const profile = await mongoService.getCurrentUser();
        if (profile) {
          setUser(profile);
          setUserProfile(profile);
        }
      } catch (error) {
        console.log('No existing session');
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
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