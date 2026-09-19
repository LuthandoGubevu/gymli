
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GYM_DOC_COLLECTION, GYM_DOC_ID } from '@/lib/gym';
import type { GymProfile } from '@/lib/types';

interface GymContextType {
  gym: GymProfile | null;
  isLoading: boolean;
}

export const GymContext = createContext<GymContextType>({ gym: null, isLoading: true });

export const GymProvider = ({ children }: { children: ReactNode }) => {
  const [gym, setGym] = useState<GymProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const gymDocRef = doc(db, GYM_DOC_COLLECTION, GYM_DOC_ID);

    const unsubscribe = onSnapshot(gymDocRef, (snapshot) => {
      setGym(snapshot.exists() ? (snapshot.data() as GymProfile) : null);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching gym profile:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <GymContext.Provider value={{ gym, isLoading }}>
      {children}
    </GymContext.Provider>
  );
};
