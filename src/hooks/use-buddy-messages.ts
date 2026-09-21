
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, doc, updateDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { BuddyMessage } from '@/lib/types';

export function useBuddyMessages(matchId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BuddyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!matchId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'buddyMatches', matchId, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BuddyMessage)));
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching buddy messages:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [matchId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!matchId || !user || !text.trim()) return;
    await addDoc(collection(db, 'buddyMatches', matchId, 'messages'), {
      senderId: user.uid,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'buddyMatches', matchId), {
      lastMessageAt: serverTimestamp(),
      lastMessageText: text.trim(),
    });
  }, [matchId, user]);

  return { messages, isLoading, sendMessage };
}
