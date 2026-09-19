import { addDoc, collection, doc, getDoc, increment, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DEDUPE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

export type CheckInSource = 'geo' | 'manual' | 'qr';

/**
 * Logs a check-in event for "busiest times" analytics, deduped so that
 * flaky geolocation retries or repeated manual check-ins within the same
 * visit don't inflate the hourly rollup. Safe to call on every check-in;
 * it no-ops if one was already logged recently for this user.
 */
export async function logCheckIn(userId: string, source: CheckInSource): Promise<void> {
  const presenceRef = doc(db, 'userPresence', userId);
  const presenceSnap = await getDoc(presenceRef);
  const lastCheckInAt = presenceSnap.data()?.lastCheckInAt as Timestamp | undefined;

  if (lastCheckInAt && Date.now() - lastCheckInAt.toMillis() < DEDUPE_WINDOW_MS) {
    return;
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const hourOfDay = now.getHours();

  await addDoc(collection(db, 'checkIns'), {
    userId,
    checkInAt: serverTimestamp(),
    source,
    dayOfWeek,
    hourOfDay,
  });

  await setDoc(presenceRef, { lastCheckInAt: serverTimestamp() }, { merge: true });

  const statsKey = `${dayOfWeek}-${hourOfDay}`;
  await setDoc(doc(db, 'gymStats', 'hourly'), { [statsKey]: increment(1) }, { merge: true });
}
