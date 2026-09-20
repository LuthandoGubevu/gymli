
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
  capacity: number;
}

// A dated occurrence of a recurring ClassInfo, within the booking window
export interface ClassOccurrence {
  slotId: string; // `${classId}_${date}`
  classId: string;
  date: string; // yyyy-MM-dd
}

// classSlots/{classId}_{date}: created lazily on first booking for that occurrence
export interface ClassSlot {
  classId: string;
  date: string; // yyyy-MM-dd
  capacity: number;
  confirmedCount: number;
  waitlistOrder: string[]; // classBookings doc IDs, in waitlist order
}

export type ClassBookingStatus = 'confirmed' | 'waitlisted' | 'cancelled';

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
  lastCheckInAt?: Timestamp;
}

// For "busiest times" analytics
export interface CheckIn {
  id: string;
  userId: string;
  checkInAt: Timestamp;
  source: 'geo' | 'manual' | 'qr';
  dayOfWeek: number; // 0 (Sunday) - 6 (Saturday), per Date.getDay()
  hourOfDay: number; // 0 - 23, per Date.getHours()
}

// gymStats/hourly doc: keys are "{dayOfWeek}-{hourOfDay}" -> visit count
export type GymStatsHourly = Record<string, number>;

// For the digital access pass
export type MembershipStatus = 'active' | 'paused' | 'expired';

// users/{uid}/notifications/{id}
export type NotificationType = 'waitlist_promoted';
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  classId?: string;
  slotId?: string;
  createdAt: Timestamp;
  readAt: Timestamp | null;
}

// gymVisits/{uid}_{yyyy-MM-dd}: one doc per member per calendar day,
// deterministic ID makes check-in idempotent against duplicate writes.
export interface GymVisit {
  userId: string;
  date: string; // yyyy-MM-dd
  source: 'geo' | 'manual' | 'qr';
  firstSeen: Timestamp;
  lastSeen: Timestamp;
}

// gamification/{uid}: derived, recomputed on each new day's first visit.
export interface UserGamification {
  currentStreakDays: number;
  longestStreakDays: number;
  lastVisitDate: string | null; // yyyy-MM-dd
  monthKey: string; // yyyy-MM
  visitsThisMonth: number;
  totalVisits: number;
  updatedAt?: Timestamp;
}

export type BadgeId =
  | 'first_visit' | 'visits_5' | 'visits_25' | 'visits_100'
  | 'streak_7' | 'streak_30'
  | 'pr_setter' | 'pr_grinder';

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
}

// userBadges/{uid}/earned/{badgeId}
export interface EarnedBadge {
  id: BadgeId;
  earnedAt: Timestamp;
}

// personalRecords/{uid}/records/{recordId}
export type WeightUnit = 'kg' | 'lb';
export interface PersonalRecord {
  id: string;
  exercise: string;
  value: number;
  unit: WeightUnit;
  date: string; // yyyy-MM-dd
  createdAt: Timestamp;
}

// leaderboard/{monthKey}/entries/{uid}: opt-in only
export interface LeaderboardEntry {
  id: string; // uid
  displayName: string;
  visitsInPeriod: number;
  streakDays: number;
  updatedAt?: Timestamp;
}

// workoutLogs/{uid}/logs/{id}: manual first pass. The `source` field is the
// seam a future native wrapper or OAuth import (Strava/Fitbit) could write
// through without a schema change - Apple HealthKit / Android Health
// Connect have no web-reachable API, so this app can't sync them directly.
export type WorkoutLogSource = 'manual' | 'healthkit' | 'healthconnect' | 'strava';
export interface WorkoutLog {
  id: string;
  date: string; // yyyy-MM-dd
  type: string;
  durationMin: number;
  notes?: string;
  source: WorkoutLogSource;
  createdAt: Timestamp;
}

// bodyMetrics/{uid}/entries/{id}
export interface BodyMetricEntry {
  id: string;
  date: string; // yyyy-MM-dd
  weightKg: number;
  source: WorkoutLogSource;
  createdAt: Timestamp;
}
