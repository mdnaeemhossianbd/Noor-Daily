import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../api/firebase';

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  isLocalSession?: boolean;
}

interface AuthContextType {
  currentUser: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
}

export const AUTHORIZED_ADMIN_EMAILS = [
  'habitsk50@gmail.com',
  'admin@noordaily.com'
];

export function isEmailAuthorized(email: string | null | undefined): boolean {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Firebase Authentication is the only source of truth for the admin session.
  // Never restore admin access from editable browser localStorage.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isEmailAuthorized(user.email)) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Administrator',
          isLocalSession: false
        });
        setIsAdmin(true);
        setAuthError(null);
      } else {
        if (user) {
          void signOut(auth).catch((error) => {
            console.error('Could not sign out unauthorized user:', error);
          });
          setAuthError(`অননুমোদিত প্রবেশাধিকার: (${user.email}) এই অ্যাকাউন্টটি অনুমোদিত নয়।`);
        }
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firebase auth state error:', error);
      setCurrentUser(null);
      setIsAdmin(false);
      setAuthError('লগইন যাচাই করা যায়নি। আবার চেষ্টা করুন।');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    setAuthError(null);
    if (!isEmailAuthorized(email)) {
      const message = 'এই ইমেইলটি Admin হিসেবে অনুমোদিত নয়।';
      setAuthError(message);
      throw new Error(message);
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Authentication failed');
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);

      if (!isEmailAuthorized(credential.user.email)) {
        await signOut(auth);
        const message = 'এই Google অ্যাকাউন্টটি Admin হিসেবে অনুমোদিত নয়।';
        setAuthError(message);
        throw new Error(message);
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      setAuthError(error.message || 'Google Sign-In failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    } finally {
      setCurrentUser(null);
      setIsAdmin(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAdmin,
      loading,
      login,
      loginWithGoogle,
      logout,
      authError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
