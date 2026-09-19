
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { doc, getDoc, query, collection, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { decodePassPayload } from "@/lib/pass";
import { logCheckIn } from "@/lib/checkin";
import { setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle2, Loader2, XCircle } from "lucide-react";

interface VerifiedMember {
  uid: string;
  displayName: string;
  memberNumber?: string;
  membershipStatus?: string;
}

const statusBadgeClass: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function PassScanner() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraSupported, setCameraSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedMember, setVerifiedMember] = useState<VerifiedMember | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCameraSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window);
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsScanning(false);
  }, []);

  const verifyByUid = useCallback(async (uid: string, passCode?: string) => {
    setIsVerifying(true);
    setError(null);
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) {
        setError("No member found for this pass.");
        return;
      }
      const data = userSnap.data();
      if (passCode && data.passCode !== passCode) {
        setError("This pass code is invalid or expired. Ask the member to reopen their pass.");
        return;
      }
      setVerifiedMember({
        uid,
        displayName: data.displayName || `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || 'Member',
        memberNumber: data.memberNumber,
        membershipStatus: data.membershipStatus,
      });
    } catch (err) {
      console.error("Error verifying member:", err);
      setError("Could not verify this member. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const handleDecoded = useCallback((rawValue: string) => {
    const payload = decodePassPayload(rawValue);
    if (!payload) {
      setError("Unrecognized code. Ask the member to show their Gymli pass.");
      return;
    }
    stopCamera();
    verifyByUid(payload.uid, payload.passCode);
  }, [stopCamera, verifyByUid]);

  const startCamera = useCallback(async () => {
    setError(null);
    setVerifiedMember(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);

      const DetectorCtor = window.BarcodeDetector;
      if (!DetectorCtor) return;
      const detector = new DetectorCtor({ formats: ['qr_code'] });

      scanTimerRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            handleDecoded(codes[0].rawValue);
          }
        } catch (err) {
          console.error("Barcode detection error:", err);
        }
      }, 500);
    } catch (err) {
      console.error("Could not start camera:", err);
      toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not access the camera. Use manual entry instead.' });
    }
  }, [handleDecoded, toast]);

  const handleManualVerify = async () => {
    if (!manualInput.trim()) return;
    setError(null);
    setVerifiedMember(null);
    setIsVerifying(true);
    try {
      const q = query(collection(db, 'users'), where('memberNumber', '==', manualInput.trim().toUpperCase()), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError("No member found with that member number.");
        return;
      }
      const userDoc = snapshot.docs[0];
      const data = userDoc.data();
      setVerifiedMember({
        uid: userDoc.id,
        displayName: data.displayName || `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || 'Member',
        memberNumber: data.memberNumber,
        membershipStatus: data.membershipStatus,
      });
    } catch (err) {
      console.error("Error looking up member:", err);
      setError("Could not look up this member. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCheckIn = async () => {
    if (!verifiedMember) return;
    try {
      await setDoc(doc(db, 'userPresence', verifiedMember.uid), {
        userId: verifiedMember.uid,
        isActive: true,
        lastSeen: serverTimestamp(),
      }, { merge: true });
      await logCheckIn(verifiedMember.uid, 'qr');
      toast({ title: '✅ Checked In', description: `${verifiedMember.displayName} has been checked in.` });
      setVerifiedMember(null);
      setManualInput("");
    } catch (err) {
      console.error("Error checking in member:", err);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not check this member in.' });
    }
  };

  const status = verifiedMember?.membershipStatus ?? 'active';

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Camera />Check-In Scanner</CardTitle>
        <CardDescription>Scan a member's pass, or enter their member number, to check them in.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {cameraSupported && (
          <div className="space-y-2">
            <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg bg-muted">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Camera preview</p>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={isScanning ? stopCamera : startCamera}>
              {isScanning ? "Stop Camera" : "Start Camera"}
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="member-number-input">
            {cameraSupported ? "Or enter member number manually" : "Enter member number"}
          </label>
          <div className="flex gap-2">
            <Input
              id="member-number-input"
              placeholder="GYM-123456"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              disabled={isVerifying}
            />
            <Button onClick={handleManualVerify} disabled={isVerifying || !manualInput.trim()}>
              {isVerifying ? <Loader2 className="animate-spin" /> : "Verify"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <XCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {verifiedMember && (
          <div className="flex flex-col items-center gap-3 rounded-md border border-primary/30 bg-primary/10 p-4">
            <CheckCircle2 className="size-8 text-primary" />
            <p className="text-lg font-semibold">{verifiedMember.displayName}</p>
            <p className="text-sm text-muted-foreground">{verifiedMember.memberNumber}</p>
            <Badge variant="outline" className={`capitalize ${statusBadgeClass[status] ?? ''}`}>{status}</Badge>
            <Button onClick={handleCheckIn} className="w-full">Check In</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
