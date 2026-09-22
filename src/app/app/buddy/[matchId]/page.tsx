
"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useBuddyMessages } from "@/hooks/use-buddy-messages";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send } from "lucide-react";

export default function BuddyChatPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { messages, isLoading, sendMessage } = useBuddyMessages(matchId);

  const [otherName, setOtherName] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId || !user) return;
    getDoc(doc(db, "buddyMatches", matchId)).then((snap) => {
      const data = snap.data();
      if (!data) return;
      const otherUid = (data.userIds as string[]).find((id) => id !== user.uid);
      if (!otherUid) return;
      getDoc(doc(db, "users", otherUid)).then((userSnap) => {
        const userData = userSnap.data();
        setOtherName(userData?.displayName || userData?.username || "Gymli member");
      });
    });
  }, [matchId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsSending(true);
    try {
      await sendMessage(newMessage);
      setNewMessage("");
    } catch (error) {
      toast({ variant: "destructive", title: "Send Error", description: "Could not send your message." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] flex-col">
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/app/buddy")}>
          <ArrowLeft className="size-5" />
        </Button>
        <Avatar className="size-9">
          <AvatarFallback>{(otherName ?? "?").charAt(0)}</AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-bold">{otherName ?? "Gym Buddy"}</h1>
      </div>

      <Card className="flex flex-1 flex-col shadow-lg">
        <CardContent className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex-1 space-y-4 overflow-y-auto pr-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-3/4 ml-auto" />
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg) => {
                const isMine = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={cn("flex items-end gap-2", { "justify-end": isMine })}>
                    <div
                      className={cn("max-w-xs rounded-2xl p-3 md:max-w-md", {
                        "bg-primary text-primary-foreground rounded-br-none": isMine,
                        "bg-muted rounded-bl-none": !isMine,
                      })}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">You matched! Say hi to {otherName ?? "your buddy"}.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="mt-4 flex items-center gap-2 border-t pt-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isSending}
            />
            <Button type="submit" size="icon" disabled={isSending || newMessage.trim() === ""}>
              <Send className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
