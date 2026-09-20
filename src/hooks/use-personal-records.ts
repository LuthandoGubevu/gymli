
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import { evaluateAndAwardBadges } from '@/lib/gamification';
import type { PersonalRecord, WeightUnit } from '@/lib/types';

export function usePersonalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'personalRecords', user.uid, 'records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecords(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PersonalRecord)));
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching personal records:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addRecord = useCallback(async (data: { exercise: string; value: number; unit: WeightUnit; date: string }) => {
    if (!user) throw new Error('Not authenticated');
    await addDoc(collection(db, 'personalRecords', user.uid, 'records'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    await evaluateAndAwardBadges(user.uid);
  }, [user]);

  const updateRecord = useCallback(async (id: string, data: { exercise: string; value: number; unit: WeightUnit; date: string }) => {
    if (!user) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'personalRecords', user.uid, 'records', id), data);
  }, [user]);

  const deleteRecord = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    await deleteDoc(doc(db, 'personalRecords', user.uid, 'records', id));
  }, [user]);

  return { records, isLoading, addRecord, updateRecord, deleteRecord };
}
