
"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { UserGamification } from '@/lib/types';

export function useGamification() {
  const { user } = useAuth();
  const [gamification, setGamification] = useState<UserGamification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGamification(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'gamification', user.uid), (snapshot) => {
      setGamification(snapshot.exists() ? (snapshot.data() as UserGamification) : null);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching gamification stats:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { gamification, isLoading };
}
