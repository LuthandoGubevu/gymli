import {
  doc, getDoc, getDocs, collection, query, where,
  runTransaction, serverTimestamp, addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BuddyProfile, PersonalRecord, SwipeAction, UserGamification } from '@/lib/types';

export function getMatchId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

/**
 * Fetches every gym member who has opted in to Gym Buddy, minus the
 * current user and anyone they've already swiped on. Firestore has no
 * "not in a subcollection" query, so the exclusion is done client-side
 * against the caller's own buddySwipes - the same client-trust tradeoff
 * already accepted for gymStats/classSlots/gamification elsewhere in this
 * app (no server able to hold a trusted credential on this deployment).
 */
export async function getBuddyCandidates(currentUid: string): Promise<BuddyProfile[]> {
  const [usersSnap, swipesSnap] = await Promise.all([
    getDocs(query(collection(db, 'users'), where('buddyOptIn', '==', true))),
    getDocs(query(collection(db, 'buddySwipes'), where('fromUserId', '==', currentUid))),
  ]);

  const alreadySwiped = new Set(swipesSnap.docs.map((d) => d.data().toUserId as string));
  const candidateIds = usersSnap.docs
    .map((d) => d.id)
    .filter((uid) => uid !== currentUid && !alreadySwiped.has(uid));

  const profiles = await Promise.all(candidateIds.map((uid) => getBuddyProfile(uid)));
  return profiles.filter((p): p is BuddyProfile => p !== null);
}

export async function getBuddyProfile(uid: string): Promise<BuddyProfile | null> {
  const [userSnap, gamSnap, prSnap, badgesSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDoc(doc(db, 'gamification', uid)),
    getDocs(collection(db, 'personalRecords', uid, 'records')),
    getDocs(collection(db, 'userBadges', uid, 'earned')),
  ]);

  if (!userSnap.exists()) return null;
  const userData = userSnap.data();
  const gam = gamSnap.data() as UserGamification | undefined;

  return {
    uid,
    displayName: userData.displayName || userData.username || 'Gymli member',
    bio: userData.bio || '',
    fitnessGoals: userData.fitnessGoals || '',
    currentStreakDays: gam?.currentStreakDays ?? 0,
    totalVisits: gam?.totalVisits ?? 0,
    personalRecords: prSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PersonalRecord)),
    earnedBadgeIds: badgesSnap.docs.map((d) => d.id) as BuddyProfile['earnedBadgeIds'],
  };
}

/**
 * Records a swipe and, on a mutual 'like', creates the match. The match is
 * created by whichever client swipes second - there's no server component
 * to arbitrate, so this races benignly: getMatchId is deterministic, so a
 * transaction guards against writing the match doc twice even if both
 * clients somehow detect the mutual like at once.
 */
export async function swipeOnCandidate(
  fromUid: string,
  toUid: string,
  action: SwipeAction,
): Promise<{ matched: boolean }> {
  const swipeRef = doc(db, 'buddySwipes', `${fromUid}_${toUid}`);
  await runTransaction(db, async (transaction) => {
    transaction.set(swipeRef, {
      fromUserId: fromUid,
      toUserId: toUid,
      action,
      createdAt: serverTimestamp(),
    });
  });

  if (action !== 'like') return { matched: false };

  const reverseSwipeSnap = await getDoc(doc(db, 'buddySwipes', `${toUid}_${fromUid}`));
  const mutualLike = reverseSwipeSnap.exists() && reverseSwipeSnap.data().action === 'like';
  if (!mutualLike) return { matched: false };

  const matchId = getMatchId(fromUid, toUid);
  const matchRef = doc(db, 'buddyMatches', matchId);
  const created = await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(matchRef);
    if (existing.exists()) return false;
    transaction.set(matchRef, {
      userIds: [fromUid, toUid].sort(),
      createdAt: serverTimestamp(),
    });
    return true;
  });

  if (created) {
    const [fromProfile, toProfile] = await Promise.all([
      getDoc(doc(db, 'users', fromUid)),
      getDoc(doc(db, 'users', toUid)),
    ]);
    const fromName = fromProfile.data()?.displayName || fromProfile.data()?.username || 'A member';
    const toName = toProfile.data()?.displayName || toProfile.data()?.username || 'A member';

    await Promise.all([
      addDoc(collection(db, 'users', toUid, 'notifications'), {
        type: 'buddy_match',
        title: "It's a match!",
        body: `You and ${fromName} are now Gym Buddies. Say hi!`,
        createdAt: serverTimestamp(),
        readAt: null,
      }),
      addDoc(collection(db, 'users', fromUid, 'notifications'), {
        type: 'buddy_match',
        title: "It's a match!",
        body: `You and ${toName} are now Gym Buddies. Say hi!`,
        createdAt: serverTimestamp(),
        readAt: null,
      }),
    ]);
  }

  return { matched: true };
}
