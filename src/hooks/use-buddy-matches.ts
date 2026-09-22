
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { BuddyMatch } from '@/lib/types';

export function useBuddyMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<BuddyMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMatches([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'buddyMatches'),
      where('userIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc'),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMatches(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BuddyMatch)));
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching buddy matches:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { matches, isLoading };
}
