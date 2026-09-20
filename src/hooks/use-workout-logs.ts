
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { WorkoutLog, BodyMetricEntry } from '@/lib/types';

export function useWorkoutLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLogs([]);
      setIsLoading(false);
      return;
    }
    const q = query(collection(db, 'workoutLogs', user.uid, 'logs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutLog)));
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching workout logs:', error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const addLog = useCallback(async (data: { date: string; type: string; durationMin: number; notes?: string }) => {
    if (!user) throw new Error('Not authenticated');
    await addDoc(collection(db, 'workoutLogs', user.uid, 'logs'), {
      ...data,
      source: 'manual',
      createdAt: serverTimestamp(),
    });
  }, [user]);

  const deleteLog = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    await deleteDoc(doc(db, 'workoutLogs', user.uid, 'logs', id));
  }, [user]);

  return { logs, isLoading, addLog, deleteLog };
}

export function useBodyMetrics() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<BodyMetricEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }
    const q = query(collection(db, 'bodyMetrics', user.uid, 'entries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BodyMetricEntry)));
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching body metrics:', error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const addEntry = useCallback(async (data: { date: string; weightKg: number }) => {
    if (!user) throw new Error('Not authenticated');
    await addDoc(collection(db, 'bodyMetrics', user.uid, 'entries'), {
      ...data,
      source: 'manual',
      createdAt: serverTimestamp(),
    });
  }, [user]);

  return { entries, isLoading, addEntry };
}
