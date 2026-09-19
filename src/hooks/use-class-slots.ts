
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ClassSlot } from '@/lib/types';

/** Subscribes to all classSlots, keyed by slot ID. Small collection for a single gym. */
export function useClassSlots() {
  const [slots, setSlots] = useState<Record<string, ClassSlot>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'classSlots'), (snapshot) => {
      const next: Record<string, ClassSlot> = {};
      snapshot.forEach((doc) => {
        next[doc.id] = doc.data() as ClassSlot;
      });
      setSlots(next);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching class slots:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { slots, isLoading };
}
