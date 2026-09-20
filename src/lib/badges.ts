import type { BadgeDefinition, BadgeId } from './types';

export const BADGE_CATALOG: BadgeDefinition[] = [
  { id: 'first_visit', name: 'First Visit', description: 'Checked in for the first time.' },
  { id: 'visits_5', name: 'Getting Started', description: 'Checked in 5 times.' },
  { id: 'visits_25', name: 'Regular', description: 'Checked in 25 times.' },
  { id: 'visits_100', name: 'Century Club', description: 'Checked in 100 times.' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Reached a 7-day check-in streak.' },
  { id: 'streak_30', name: 'Iron Will', description: 'Reached a 30-day check-in streak.' },
  { id: 'pr_setter', name: 'PR Setter', description: 'Logged your first personal record.' },
  { id: 'pr_grinder', name: 'PR Grinder', description: 'Logged 5 personal records.' },
];

export interface BadgeEvalStats {
  totalVisits: number;
  longestStreakDays: number;
  prCount: number;
}

export function evaluateBadges(stats: BadgeEvalStats): BadgeId[] {
  const earned: BadgeId[] = [];
  if (stats.totalVisits >= 1) earned.push('first_visit');
  if (stats.totalVisits >= 5) earned.push('visits_5');
  if (stats.totalVisits >= 25) earned.push('visits_25');
  if (stats.totalVisits >= 100) earned.push('visits_100');
  if (stats.longestStreakDays >= 7) earned.push('streak_7');
  if (stats.longestStreakDays >= 30) earned.push('streak_30');
  if (stats.prCount >= 1) earned.push('pr_setter');
  if (stats.prCount >= 5) earned.push('pr_grinder');
  return earned;
}
