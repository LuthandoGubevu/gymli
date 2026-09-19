
"use client";
import { useContext } from 'react';
import { GymContext } from '@/components/gym-provider';

export const useGym = () => {
  const context = useContext(GymContext);
  if (context === undefined) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};
