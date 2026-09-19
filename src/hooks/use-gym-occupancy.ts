
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

// Returns live occupancy for the (single) gym
export function useGymOccupancy() {
  const [occupancy, setOccupancy] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const presenceQuery = query(
      collection(db, 'userPresence'),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      const fiveMinutesAgo = Date.now() - FIVE_MINUTES_IN_MS;
      let activeCount = 0;
      snapshot.forEach((doc) => {
        const presence = doc.data();
        if (presence.lastSeen && presence.lastSeen.toMillis() > fiveMinutesAgo) {
          activeCount++;
        }
      });
      setOccupancy(activeCount);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching gym occupancy:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { occupancy, isLoading };
}
