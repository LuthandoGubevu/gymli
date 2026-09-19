
"use client";

import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useGym } from '@/hooks/use-gym';
import { getDistance } from '@/lib/geolocation';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_GEOFENCE_METERS } from '@/lib/gym';
import { logCheckIn, type CheckInSource } from '@/lib/checkin';

interface PresenceContextType {
  isCheckingIn: boolean;
  manualCheckIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  isCheckedIn: boolean;
}

const PresenceContext = createContext<PresenceContextType>({
  isCheckingIn: false,
  manualCheckIn: async () => {},
  checkOut: async () => {},
  isCheckedIn: false,
});

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { gym } = useGym();
  const { toast } = useToast();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const updatePresence = useCallback(async (isActive: boolean, source?: CheckInSource) => {
    if (!user) return;

    const presenceRef = doc(db, 'userPresence', user.uid);
    try {
      if (isActive) {
        await setDoc(presenceRef, {
          userId: user.uid,
          isActive: true,
          lastSeen: serverTimestamp(),
        }, { merge: true });
        if (source) {
          logCheckIn(user.uid, source).catch((error) => console.error("Failed to log check-in:", error));
        }
      } else {
        await setDoc(presenceRef, { isActive: false }, { merge: true });
      }
      setIsCheckedIn(isActive);
    } catch (error) {
      console.error("Failed to update presence:", error);
    }
  }, [user]);

  const isAtGym = useCallback((coords: GeolocationCoordinates): boolean => {
    if (!gym?.latitude || !gym?.longitude) return false;
    const distance = getDistance(coords.latitude, coords.longitude, gym.latitude, gym.longitude);
    return distance <= (gym.geofenceRadiusMeters ?? DEFAULT_GEOFENCE_METERS);
  }, [gym]);

  // Automatic presence update logic
  useEffect(() => {
    if (!user || !user.autoPresenceEnabled || !navigator.geolocation) {
      // If user logs out or disables auto-presence, ensure they are checked out
      if (isCheckedIn) {
        updatePresence(false);
      }
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const nearby = isAtGym(position.coords);
      // Only update if the status changes to avoid unnecessary writes
      if (nearby !== isCheckedIn) {
        updatePresence(nearby, nearby ? 'geo' : undefined);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn(`Geolocation error: ${error.message}`);
      // If there's an error, check the user out to be safe
      updatePresence(false);
    };

    // Initial check
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);

    // Watch for changes
    const watcherId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 60000,
    });

    return () => navigator.geolocation.clearWatch(watcherId);

  }, [user, user?.autoPresenceEnabled, isAtGym, updatePresence, isCheckedIn]);

  const manualCheckIn = useCallback(async () => {
    setIsCheckingIn(true);
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Geolocation not supported' });
      setIsCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nearby = isAtGym(position.coords);
        if (nearby) {
          await updatePresence(true, 'manual');
          toast({ title: 'Checked In!', description: `Welcome to ${gym?.gymName || 'Gymli'}` });
        } else {
          toast({ variant: 'destructive', title: 'Not Nearby', description: `You need to be within the gym's check-in radius.` });
        }
        setIsCheckingIn(false);
      },
      () => {
        toast({ variant: 'destructive', title: 'Could not get location', description: 'Please ensure location services are enabled.' });
        setIsCheckingIn(false);
      },
      { enableHighAccuracy: true }
    );
  }, [isAtGym, updatePresence, toast, gym]);

  const checkOut = useCallback(async () => {
    await updatePresence(false);
  }, [updatePresence]);

  const value = {
    isCheckingIn,
    manualCheckIn,
    checkOut,
    isCheckedIn,
  };

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
};
