
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useBuddyMatches } from "@/hooks/use-buddy-matches";
import { getBuddyCandidates, swipeOnCandidate } from "@/lib/buddy";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BuddyProfileCard } from "@/components/buddy-profile-card";
import { Heart, X, Users } from "lucide-react";
import type { BuddyProfile, BuddyMatch } from "@/lib/types";

export default function BuddyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOptingIn, setIsOptingIn] = useState(false);

  const handleOptIn = async () => {
    if (!user) return;
    setIsOptingIn(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { buddyOptIn: true });
      user.buddyOptIn = true;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not turn on Gym Buddy." });
    } finally {
      setIsOptingIn(false);
    }
  };

  if (!user?.buddyOptIn) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold md:text-3xl">Gym Buddy</h1>
        <Card className="mx-auto max-w-md shadow-lg">
          <CardHeader className="items-center text-center">
            <Heart className="size-10 text-primary" />
            <CardTitle>Find a Gym Buddy</CardTitle>
            <CardDescription>
              Turn this on to discover other members looking for a training partner. Your reps, achievements
              and personal records show on your card - members who like each other get matched and can chat.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleOptIn} disabled={isOptingIn} size="lg" className="font-bold">
              {isOptingIn ? "Turning on..." : "Turn On Gym Buddy"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold md:text-3xl">Gym Buddy</h1>
      <Tabs defaultValue="discover">
        <TabsList>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="matches">My Matches</TabsTrigger>
        </TabsList>
        <TabsContent value="discover" className="mt-6">
          <DiscoverDeck />
        </TabsContent>
        <TabsContent value="matches" className="mt-6">
          <MatchesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DiscoverDeck() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<BuddyProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    getBuddyCandidates(user.uid).then((profiles) => {
      if (!cancelled) {
        setCandidates(profiles);
        setIndex(0);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  const handleSwipe = useCallback(async (action: "like" | "pass") => {
    if (!user || isSwiping) return;
    const candidate = candidates[index];
    if (!candidate) return;

    setIsSwiping(true);
    try {
      const { matched } = await swipeOnCandidate(user.uid, candidate.uid, action);
      if (matched) {
        toast({ title: "🎉 It's a match!", description: `You and ${candidate.displayName} can now chat.` });
      }
      setIndex((i) => i + 1);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not record your swipe." });
    } finally {
      setIsSwiping(false);
    }
  }, [user, isSwiping, candidates, index, toast]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  const candidate = candidates[index];

  if (!candidate) {
    return (
      <Card className="mx-auto max-w-md shadow-lg">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Users className="size-10 text-muted-foreground" />
          <p className="font-medium">No more members to discover right now</p>
          <p className="text-sm text-muted-foreground">Check back later as more members turn on Gym Buddy.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <BuddyProfileCard profile={candidate} />
      <div className="flex justify-center gap-6">
        <Button
          size="icon"
          variant="outline"
          className="size-16 rounded-full border-2"
          onClick={() => handleSwipe("pass")}
          disabled={isSwiping}
          aria-label="Pass"
        >
          <X className="size-7 text-muted-foreground" />
        </Button>
        <Button
          size="icon"
          className="size-16 rounded-full bg-primary hover:bg-primary/90"
          onClick={() => handleSwipe("like")}
          disabled={isSwiping}
          aria-label="Like"
        >
          <Heart className="size-7" />
        </Button>
      </div>
    </div>
  );
}

function MatchesList() {
  const { matches, isLoading } = useBuddyMatches();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="mx-auto max-w-md shadow-lg">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Heart className="size-10 text-muted-foreground" />
          <p className="font-medium">No matches yet</p>
          <p className="text-sm text-muted-foreground">Like a few members in Discover to find your Gym Buddy.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-3">
      {matches.map((match) => (
        <MatchRow key={match.id} match={match} />
      ))}
    </div>
  );
}

function MatchRow({ match }: { match: BuddyMatch }) {
  const { user } = useAuth();
  const [otherName, setOtherName] = useState<string | null>(null);
  const otherUid = match.userIds.find((id) => id !== user?.uid) ?? match.userIds[0];

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, "users", otherUid)).then((snap) => {
      if (cancelled) return;
      const data = snap.data();
      setOtherName(data?.displayName || data?.username || "Gymli member");
    });
    return () => { cancelled = true; };
  }, [otherUid]);

  return (
    <Link href={`/app/buddy/${match.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-3 p-4">
          <Avatar className="size-10">
            <AvatarFallback>{(otherName ?? "?").charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{otherName ?? "Loading..."}</p>
            <p className="truncate text-sm text-muted-foreground">
              {match.lastMessageText || "Say hi to your new Gym Buddy!"}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
