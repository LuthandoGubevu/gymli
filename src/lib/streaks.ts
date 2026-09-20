import { format, parseISO, subDays } from 'date-fns';
import type { UserGamification } from './types';

export function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

/**
 * Computes the next gamification snapshot after a fresh visit on `todayKey`.
 * Pure and unit-testable; the caller is responsible for only invoking this
 * once per calendar day per member (guarded by the gymVisits doc's
 * deterministic ID existing check).
 *
 * Simple first pass: a streak is consecutive calendar days with a visit, no
 * grace period for an occasional missed day. Weekly/monthly streak
 * milestones are not tracked separately - daily streak length covers the
 * same "consistency" signal without the extra bookkeeping.
 */
export function computeNextGamification(
  prev: UserGamification | null,
  todayKey: string
): Omit<UserGamification, 'updatedAt'> {
  const today = parseISO(todayKey);
  const currentMonthKey = monthKey(today);

  if (!prev) {
    return {
      currentStreakDays: 1,
      longestStreakDays: 1,
      lastVisitDate: todayKey,
      monthKey: currentMonthKey,
      visitsThisMonth: 1,
      totalVisits: 1,
    };
  }

  const yesterdayKey = dateKey(subDays(today, 1));
  const continuesStreak = prev.lastVisitDate === yesterdayKey;
  const currentStreakDays = continuesStreak ? prev.currentStreakDays + 1 : 1;
  const longestStreakDays = Math.max(prev.longestStreakDays, currentStreakDays);
  const sameMonth = prev.monthKey === currentMonthKey;

  return {
    currentStreakDays,
    longestStreakDays,
    lastVisitDate: todayKey,
    monthKey: currentMonthKey,
    visitsThisMonth: sameMonth ? prev.visitsThisMonth + 1 : 1,
    totalVisits: prev.totalVisits + 1,
  };
}
