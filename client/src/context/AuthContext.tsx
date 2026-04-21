"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiJson } from "@/lib/api";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  setBackupPassword: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (fUser: FirebaseUser) => {
    try {
      const profile = await apiJson<User & { uid?: string }>("/api/me");
      setUser({ ...profile, uid: fUser.uid } as User);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        await loadProfile(fUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await loadProfile(auth.currentUser);
    }
  };

  const setBackupPassword = async (password: string) => {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, password);
    } else {
      throw new Error("No user is currently logged in.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout, setBackupPassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
