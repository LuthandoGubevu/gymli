
"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Megaphone } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  text: string;
  timestamp: Timestamp | null;
  isAnnouncement?: boolean;
}

const formatTimestamp = (timestamp: Timestamp | null) => {
  if (!timestamp) return '';
  return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesColRef = collection(db, 'chatMessages');
    const q = query(messagesColRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(fetchedMessages);
      setIsFetching(false);
    }, (error) => {
        console.error("Error fetching messages: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch messages.",
        });
        setIsFetching(false);
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    setIsLoading(true);
    const messagesColRef = collection(db, 'chatMessages');
    try {
      await addDoc(messagesColRef, {
        text: newMessage,
        sender: {
          id: user.uid,
          name: user.username || user.displayName || 'Anonymous',
        },
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Send Error',
        description: 'Could not send your message. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] flex-col">
       <div className="mb-4">
        <h1 className="text-2xl font-bold md:text-3xl mt-2">Gymli Group Chat</h1>
      </div>

      <Card className="flex flex-1 flex-col shadow-lg">
        <CardContent className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex-1 space-y-4 overflow-y-auto pr-4">
            {isFetching ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-3/4 ml-auto" />
                <Skeleton className="h-12 w-1/2" />
              </div>
            ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isMyMessage = msg.sender.id === user?.uid;

                  if (msg.isAnnouncement) {
                    return (
                        <div key={msg.id} className="w-full">
                            <div className="my-2 mx-auto max-w-lg p-3 text-center rounded-lg bg-primary/10 border border-primary/20 text-primary-foreground">
                                <p className="font-bold flex items-center justify-center gap-2 text-primary"><Megaphone/> Announcement</p>
                                <p className="text-sm mt-1">{msg.text}</p>
                                <p className="mt-2 text-xs opacity-70">{formatTimestamp(msg.timestamp)}</p>
                            </div>
                        </div>
                    );
                  }

                  return (
                    <div
                        key={msg.id}
                        className={cn('flex items-end gap-2', {
                            'justify-end': isMyMessage,
                        })}
                        >
                        {!isMyMessage && (
                             <Avatar className="h-8 w-8">
                                <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <div
                            className={cn('max-w-xs rounded-2xl p-3 md:max-w-md', {
                            'bg-primary text-primary-foreground rounded-br-none': isMyMessage,
                            'bg-muted rounded-bl-none': !isMyMessage,
                            })}
                        >
                            <p className="text-sm font-bold">{isMyMessage ? 'You' : msg.sender.name}</p>
                            <p className="text-sm">{msg.text}</p>
                            <p className="mt-1 text-xs opacity-70 text-right">{formatTimestamp(msg.timestamp)}</p>
                        </div>
                    </div>
                )})
            ) : (
                 <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2 border-t pt-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || newMessage.trim() === ''}>
              <Send className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
