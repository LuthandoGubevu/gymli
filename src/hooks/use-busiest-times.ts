
"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GymStatsHourly } from '@/lib/types';

export interface HourlyBar {
  hour: number;
  label: string;
  count: number;
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
});

export function useBusiestTimes() {
  const [stats, setStats] = useState<GymStatsHourly>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'gymStats', 'hourly'), (snapshot) => {
      setStats(snapshot.exists() ? (snapshot.data() as GymStatsHourly) : {});
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching busiest times:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const today = new Date().getDay();
  const currentHour = new Date().getHours();

  const bars: HourlyBar[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: HOUR_LABELS[hour],
    count: stats[`${today}-${hour}`] ?? 0,
  }));

  const hasData = bars.some((bar) => bar.count > 0);
  const quietest = hasData
    ? bars.reduce((min, bar) => (bar.count < min.count ? bar : min))
    : null;

  return { bars, currentHour, hasData, quietest, isLoading };
}
