
"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit as fbLimit, onSnapshot, type QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notice } from '@/lib/types';

export function useNotices(limitCount?: number) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    if (limitCount) constraints.push(fbLimit(limitCount));
    const q = query(collection(db, 'notices'), ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Notice)));
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching notices:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [limitCount]);

  return { notices, isLoading };
}
