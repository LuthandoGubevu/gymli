
"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { monthKey } from '@/lib/streaks';
import type { LeaderboardEntry } from '@/lib/types';

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentMonthKey = monthKey(new Date());
    const q = query(
      collection(db, 'leaderboard', currentMonthKey, 'entries'),
      orderBy('visitsInPeriod', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as LeaderboardEntry)));
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching leaderboard:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { entries, isLoading };
}
