import {
  doc,
  getDoc,
  getDocs,
  collection,
  runTransaction,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { computeNextGamification, dateKey, monthKey as toMonthKey } from '@/lib/streaks';
import { evaluateBadges } from '@/lib/badges';
import type { UserGamification } from '@/lib/types';

/**
 * Design note: gamification writes happen client-side (self-write, guarded
 * by Firestore rules), not via a trusted server action. This app has no
 * backend able to hold a service-account secret reliably (it deploys to
 * Netlify, not Firebase App Hosting, so there's no ambient Google
 * Application Default Credentials for firebase-admin) - wiring up
 * firebase-admin here would mean a secret only I could configure and never
 * verify actually works. Idempotency comes from gymVisits' deterministic
 * doc ID instead: a member could in principle inflate their own stats via
 * a direct Firestore write, which is the same trust tradeoff already
 * accepted elsewhere in this app (gymStats, classSlots counters).
 */

export async function recordVisit(userId: string, source: 'geo' | 'manual' | 'qr'): Promise<void> {
  const todayKey = dateKey(new Date());
  const visitRef = doc(db, 'gymVisits', `${userId}_${todayKey}`);
  const gamificationRef = doc(db, 'gamification', userId);

  const isFreshVisit = await runTransaction(db, async (transaction) => {
    const visitSnap = await transaction.get(visitRef);
    const gamSnap = await transaction.get(gamificationRef);

    if (visitSnap.exists()) {
      transaction.set(visitRef, { lastSeen: serverTimestamp() }, { merge: true });
      return false;
    }

    const prev = gamSnap.exists() ? (gamSnap.data() as UserGamification) : null;
    const next = computeNextGamification(prev, todayKey);

    transaction.set(visitRef, {
      userId,
      date: todayKey,
      source,
      firstSeen: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
    transaction.set(gamificationRef, { ...next, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  });

  if (isFreshVisit) {
    await Promise.all([
      evaluateAndAwardBadges(userId),
      maybeUpdateLeaderboard(userId),
    ]);
  }
}

export async function evaluateAndAwardBadges(userId: string): Promise<void> {
  const [gamSnap, prSnap, earnedSnap] = await Promise.all([
    getDoc(doc(db, 'gamification', userId)),
    getDocs(collection(db, 'personalRecords', userId, 'records')),
    getDocs(collection(db, 'userBadges', userId, 'earned')),
  ]);

  const gam = gamSnap.data() as UserGamification | undefined;
  if (!gam) return;

  const earnedIds = new Set(earnedSnap.docs.map((d) => d.id));
  const eligible = evaluateBadges({
    totalVisits: gam.totalVisits,
    longestStreakDays: gam.longestStreakDays,
    prCount: prSnap.size,
  });
  const newlyEarned = eligible.filter((id) => !earnedIds.has(id));
  if (newlyEarned.length === 0) return;

  const batch = writeBatch(db);
  newlyEarned.forEach((id) => {
    batch.set(doc(db, 'userBadges', userId, 'earned', id), { earnedAt: serverTimestamp() });
  });
  await batch.commit();
}

export async function maybeUpdateLeaderboard(userId: string): Promise<void> {
  const [userSnap, gamSnap] = await Promise.all([
    getDoc(doc(db, 'users', userId)),
    getDoc(doc(db, 'gamification', userId)),
  ]);
  if (!userSnap.data()?.leaderboardOptIn) return;

  const gam = gamSnap.data() as UserGamification | undefined;
  if (!gam) return;

  const currentMonthKey = toMonthKey(new Date());
  const userData = userSnap.data();
  await setDoc(doc(db, 'leaderboard', currentMonthKey, 'entries', userId), {
    displayName: userData?.displayName || userData?.username || 'Member',
    visitsInPeriod: gam.visitsThisMonth,
    streakDays: gam.currentStreakDays,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function removeFromLeaderboard(userId: string): Promise<void> {
  const currentMonthKey = toMonthKey(new Date());
  await deleteDoc(doc(db, 'leaderboard', currentMonthKey, 'entries', userId)).catch(() => {});
}
