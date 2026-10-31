import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider, githubProvider, isFirebaseConfigured } from './firebase';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signInWithGitHub: async () => {},
  signInAsGuest: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
});

export const useAuth = () => useContext(AuthContext);

const LOCAL_STORAGE_USER_KEY = 'oscontro_active_user';

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMockMode = import.meta.env.VITE_USE_MOCK === 'true';

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }

    if (isMockMode || !isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const u = {
          uid: fbUser.uid,
          displayName: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
        };
        setUser(u);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(u));
      } else {
        if (!localStorage.getItem(LOCAL_STORAGE_USER_KEY)?.includes('guest')) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isMockMode]);

  const signInWithGoogle = async () => {
    setError(null);
    if (isMockMode) {
      const mockUser: AuthUser = {
        uid: 'mock-google-user',
        displayName: 'Demo Google User',
        email: 'developer@example.com',
        photoURL: null,
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return;
    }

    if (!auth) {
      setError('Firebase is not configured.');
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err?.message || 'Failed to sign in with Google');
    }
  };

  const signInWithGitHub = async () => {
    setError(null);
    if (isMockMode) {
      const mockUser: AuthUser = {
        uid: 'mock-github-user',
        displayName: 'Demo GitHub User',
        email: 'octocat@example.com',
        photoURL: null,
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return;
    }

    if (!auth) {
      setError('Firebase is not configured.');
      return;
    }

    try {
      await signInWithPopup(auth, githubProvider);
    } catch (err: any) {
      console.error('GitHub sign-in error:', err);
      setError(err?.message || 'Failed to sign in with GitHub');
    }
  };

  const signInAsGuest = async () => {
    setError(null);
    const guestUser: AuthUser = {
      uid: 'guest-user',
      displayName: 'Guest Contributor',
      email: 'guest@oscontro.dev',
      photoURL: null,
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err: any) {
        console.error('Sign-out error:', err);
      }
    }
    setUser(null);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (isMockMode) {
      return 'mock-token';
    }
    if (auth?.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        signInWithGitHub,
        signInAsGuest,
        signOut,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

