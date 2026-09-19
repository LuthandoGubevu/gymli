import {
  doc,
  runTransaction,
  serverTimestamp,
  collection,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ClassInfo, ClassBookingStatus } from '@/lib/types';

interface BookClassArgs {
  userId: string;
  userName: string;
  userEmail: string | null;
  cls: ClassInfo;
  date: string; // yyyy-MM-dd
  slotId: string;
}

export interface BookClassResult {
  bookingId: string;
  status: ClassBookingStatus;
  waitlistPosition?: number;
}

/**
 * Books a class occurrence: confirms immediately if the slot has room,
 * otherwise joins the waitlist. The slot doc is created lazily on first
 * booking. All reads/writes are by direct document reference, so this is
 * safe as a single client-side transaction (no Cloud Functions needed).
 */
export async function bookClass({ userId, userName, userEmail, cls, date, slotId }: BookClassArgs): Promise<BookClassResult> {
  const slotRef = doc(db, 'classSlots', slotId);
  const bookingRef = doc(collection(db, 'classBookings'));

  return runTransaction(db, async (transaction) => {
    const slotSnap = await transaction.get(slotRef);
    const capacity = cls.capacity;
    const confirmedCount = slotSnap.exists() ? (slotSnap.data().confirmedCount as number) : 0;
    const waitlistOrder: string[] = slotSnap.exists() ? (slotSnap.data().waitlistOrder as string[] ?? []) : [];

    const bookingBase = {
      userId,
      userName,
      userEmail,
      classId: cls.id,
      className: cls.name,
      classDay: cls.day,
      classTime: cls.time,
      classDate: date,
      slotId,
      createdAt: serverTimestamp(),
    };

    if (confirmedCount < capacity) {
      transaction.set(slotRef, {
        classId: cls.id,
        date,
        capacity,
        confirmedCount: confirmedCount + 1,
        waitlistOrder,
      }, { merge: true });
      transaction.set(bookingRef, { ...bookingBase, status: 'confirmed' });
      return { bookingId: bookingRef.id, status: 'confirmed' as ClassBookingStatus };
    }

    const newWaitlistOrder = [...waitlistOrder, bookingRef.id];
    transaction.set(slotRef, {
      classId: cls.id,
      date,
      capacity,
      confirmedCount,
      waitlistOrder: newWaitlistOrder,
    }, { merge: true });
    transaction.set(bookingRef, { ...bookingBase, status: 'waitlisted', waitlistPosition: newWaitlistOrder.length });
    return { bookingId: bookingRef.id, status: 'waitlisted' as ClassBookingStatus, waitlistPosition: newWaitlistOrder.length };
  });
}

/**
 * Cancels a booking. If it was confirmed, frees a spot and immediately
 * promotes the next waitlisted booking (found via the slot's waitlistOrder
 * pointer, so no query is needed - just a direct-reference get within the
 * same transaction) and notifies that member.
 */
export async function cancelClassBooking(bookingId: string): Promise<void> {
  const bookingRef = doc(db, 'classBookings', bookingId);

  await runTransaction(db, async (transaction) => {
    // --- All reads happen first; Firestore transactions forbid reads after writes. ---
    const bookingSnap = await transaction.get(bookingRef);
    if (!bookingSnap.exists()) return;
    const booking = bookingSnap.data();
    if (booking.status === 'cancelled') return;

    const slotRef = doc(db, 'classSlots', booking.slotId as string);
    const slotSnap = await transaction.get(slotRef);
    if (!slotSnap.exists()) {
      transaction.update(bookingRef, { status: 'cancelled' });
      return;
    }
    const slot = slotSnap.data();
    let confirmedCount = slot.confirmedCount as number;
    let waitlistOrder: string[] = slot.waitlistOrder ?? [];

    const wasConfirmed = booking.status === 'confirmed';
    if (wasConfirmed) {
      confirmedCount = Math.max(0, confirmedCount - 1);
    } else {
      waitlistOrder = waitlistOrder.filter((id) => id !== bookingId);
    }

    const canPromote = wasConfirmed && confirmedCount < (slot.capacity as number) && waitlistOrder.length > 0;
    const nextBookingRef = canPromote ? doc(db, 'classBookings', waitlistOrder[0]) : null;
    const nextBookingSnap = nextBookingRef ? await transaction.get(nextBookingRef) : null;
    const nextBookingValid = !!nextBookingSnap?.exists() && nextBookingSnap.data()?.status === 'waitlisted';

    // --- All writes happen after every read above. ---
    transaction.update(bookingRef, { status: 'cancelled' });

    if (nextBookingValid && nextBookingRef && nextBookingSnap) {
      transaction.update(nextBookingRef, { status: 'confirmed', waitlistPosition: null });
      confirmedCount += 1;
      waitlistOrder = waitlistOrder.slice(1);

      const nextUserId = nextBookingSnap.data()!.userId as string;
      const className = nextBookingSnap.data()!.className as string;
      const notificationRef = doc(collection(db, 'users', nextUserId, 'notifications'));
      transaction.set(notificationRef, {
        type: 'waitlist_promoted',
        title: "You're in!",
        body: `A spot opened up in ${className} and you've been confirmed.`,
        classId: nextBookingSnap.data()!.classId,
        slotId: booking.slotId,
        createdAt: serverTimestamp(),
        readAt: null,
      });
    }

    transaction.set(slotRef, { confirmedCount, waitlistOrder }, { merge: true });
  });
}
