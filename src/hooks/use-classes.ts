
"use client";
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ClassInfo } from '@/lib/types';

export function useClasses() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'classes'), (snapshot) => {
      setClasses(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClassInfo)));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching classes:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { classes, isLoading };
}
