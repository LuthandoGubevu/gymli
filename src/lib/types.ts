
import type { Timestamp } from 'firebase/firestore';
import * as z from 'zod';

// For Classes
export type ClassName =
  | 'Spinning' | 'Step' | 'Body Con' | 'Box' | 'HIIT' | 'Small Group PT'
  | 'Spinn' | 'Instructor Decides' | 'Only for the Brave' | '';
export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
export type TimeSlot = string;
export interface ClassInfo {
  id: string;
  time: TimeSlot;
  day: Day;
  name: ClassName;
}

// For Trainers
export type Specialty = 'Strength' | 'HIIT' | 'Cardio' | 'Boxing' | 'Body Con' | 'Spinning' | 'Step';
export interface Trainer {
    id: string;
    name: string;
    specialties: Specialty[];
    availability: {
        [key in Day]?: string[];
    };
    avatarUrl: string;
}

// For the Gym Settings Form (single fixed gym/branch)
export const gymSettingsFormSchema = z.object({
  gymName: z.string().min(3, { message: "Gym name must be at least 3 characters." }),
  address: z.string().min(10, { message: "Address seems too short." }),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  geofenceRadiusMeters: z.coerce.number().int().positive().default(100),
  waitTime: z.string().optional(),
  thresholdLow: z.coerce.number().int().nonnegative(),
  thresholdModerate: z.coerce.number().int().nonnegative(),
  thresholdPacked: z.coerce.number().int().nonnegative(),
  promotionTags: z.string().optional(),
  workoutFocusAreas: z.string().optional(),
  trainerOrGuestInfo: z.string().optional(),
  generalGymNotice: z.string().optional(),
  offerExpiryDate: z.date().optional(),
});
export type GymSettingsFormData = z.infer<typeof gymSettingsFormSchema>;

// The single fixed gym's profile doc (config/gym)
export interface GymProfile extends Omit<GymSettingsFormData, 'offerExpiryDate'> {
  offerExpiryDate?: Timestamp | null;
  updatedAt?: Timestamp;
}

// For User Presence
export interface UserPresence {
  userId: string;
  isActive: boolean;
  lastSeen: Timestamp;
}
