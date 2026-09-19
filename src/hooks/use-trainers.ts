
"use client";
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Trainer } from '@/lib/types';

export function useTrainers() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'trainers'), (snapshot) => {
      setTrainers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trainer)));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching trainers:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { trainers, isLoading };
}
