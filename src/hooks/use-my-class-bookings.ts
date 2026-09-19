
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';

export interface MyClassBooking {
  id: string;
  slotId: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  waitlistPosition?: number;
}

/** The signed-in member's own non-cancelled class bookings, keyed by slotId. */
export function useMyClassBookings() {
  const { user } = useAuth();
  const [bookingsBySlot, setBookingsBySlot] = useState<Record<string, MyClassBooking>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBookingsBySlot({});
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'classBookings'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next: Record<string, MyClassBooking> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'cancelled') return;
        next[data.slotId] = {
          id: doc.id,
          slotId: data.slotId,
          status: data.status,
          waitlistPosition: data.waitlistPosition,
        };
      });
      setBookingsBySlot(next);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching my class bookings:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { bookingsBySlot, isLoading };
}
