"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';

export function usePendingBookings() {
  const { user } = useAuth();
  const [pendingClassBookings, setPendingClassBookings] = useState(0);
  const [pendingTrainerBookings, setPendingTrainerBookings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setPendingClassBookings(0);
      setPendingTrainerBookings(0);
      setIsLoading(false);
      return;
    }

    // Class bookings auto-resolve to confirmed/waitlisted based on capacity,
    // so there's nothing for admin to approve - "pending" here surfaces how
    // many members are currently on a waitlist instead.
    const classQuery = query(collection(db, "classBookings"), where("status", "==", "waitlisted"));
    const classUnsubscribe = onSnapshot(classQuery, (snapshot) => {
      setPendingClassBookings(snapshot.size);
      setIsLoading(false);
    }, () => setIsLoading(false));

    const trainerQuery = query(collection(db, "trainerBookings"), where("status", "==", "pending"));
    const trainerUnsubscribe = onSnapshot(trainerQuery, (snapshot) => {
      setPendingTrainerBookings(snapshot.size);
    }, () => setIsLoading(false));

    return () => {
      classUnsubscribe();
      trainerUnsubscribe();
    };
  }, [user]);

  return { 
    pendingClassBookings, 
    pendingTrainerBookings, 
    totalPending: pendingClassBookings + pendingTrainerBookings,
    isLoading 
  };
}
