
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from './use-auth';
import { useGamification } from './use-gamification';
import { usePersonalRecords } from './use-personal-records';
import type { WeeklyPlanOutput } from '@/ai/flows/weekly-plan';

export interface StoredWeeklyPlan extends WeeklyPlanOutput {
  id: string;
}

export function useAiCoach() {
  const { user } = useAuth();
  const { gamification } = useGamification();
  const { records } = usePersonalRecords();
  const [plan, setPlan] = useState<StoredWeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPlan(null);
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'workoutPlans', user.uid, 'plans'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlan(snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as StoredWeeklyPlan);
      setIsLoading(false);
    }, (err) => {
      console.error('Error fetching workout plan:', err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const generatePlan = useCallback(async () => {
    if (!user) return;
    setIsGenerating(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('You need to be signed in to generate a plan.');

      const bookingsSnap = await getDocs(
        query(collection(db, 'classBookings'), where('userId', '==', user.uid), where('status', '==', 'confirmed'))
      );
      const recentClasses = bookingsSnap.docs.slice(0, 10).map((d) => ({
        className: d.data().className as string,
        classDay: d.data().classDay as string,
      }));

      const response = await fetch('/api/ai/weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          fitnessGoals: user.fitnessGoals,
          currentStreakDays: gamification?.currentStreakDays ?? 0,
          longestStreakDays: gamification?.longestStreakDays ?? 0,
          visitsThisMonth: gamification?.visitsThisMonth ?? 0,
          totalVisits: gamification?.totalVisits ?? 0,
          personalRecords: records.map((r) => ({ exercise: r.exercise, value: r.value, unit: r.unit })),
          recentClasses,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to generate a plan. Please try again.');
      }

      const { result } = await response.json();
      await addDoc(collection(db, 'workoutPlans', user.uid, 'plans'), {
        ...result,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error generating weekly plan:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsGenerating(false);
    }
  }, [user, gamification, records]);

  return { plan, isLoading, isGenerating, error, generatePlan };
}
