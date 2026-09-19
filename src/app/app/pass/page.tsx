
"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { generatePassCode, encodePassPayload } from "@/lib/pass";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const statusBadgeClass: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function PassPage() {
  const { user } = useAuth();
  const [passCode, setPassCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const newCode = generatePassCode();
    setDoc(doc(db, 'users', user.uid), {
      passCode: newCode,
      passCodeUpdatedAt: serverTimestamp(),
    }, { merge: true })
      .then(() => setPassCode(newCode))
      .catch((error) => console.error("Failed to rotate pass code:", error));
  }, [user]);

  const status = user?.membershipStatus ?? 'active';

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>My Access Pass</CardTitle>
          <CardDescription>Show this code at the front desk to check in.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-white p-4">
            {user && passCode ? (
              <QRCodeSVG value={encodePassPayload(user.uid, passCode)} size={220} level="M" />
            ) : (
              <Skeleton className="h-[220px] w-[220px]" />
            )}
          </div>
          <div className="text-center">
            <p className="text-xl font-bold tracking-wide">{user?.memberNumber ?? '—'}</p>
            <p className="text-sm text-muted-foreground">{user?.displayName}</p>
          </div>
          <Badge variant="outline" className={`capitalize ${statusBadgeClass[status]}`}>{status}</Badge>
          <p className="text-xs text-muted-foreground text-center">
            This code refreshes each time you open this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
