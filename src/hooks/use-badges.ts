
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import { BADGE_CATALOG } from '@/lib/badges';
import type { BadgeId } from '@/lib/types';

export function useBadges() {
  const { user } = useAuth();
  const [earnedIds, setEarnedIds] = useState<Set<BadgeId>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEarnedIds(new Set());
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'userBadges', user.uid, 'earned'), (snapshot) => {
      setEarnedIds(new Set(snapshot.docs.map((d) => d.id as BadgeId)));
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching badges:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const badges = BADGE_CATALOG.map((badge) => ({ ...badge, achieved: earnedIds.has(badge.id) }));

  return { badges, isLoading };
}
