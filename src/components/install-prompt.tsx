"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

// Define the interface for the BeforeInstallPromptEvent, which is not standard in all TS libs
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}


export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if(choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // We've used the prompt, and can't use it again, so clear it
      setDeferredPrompt(null);
      setIsVisible(false);
    });
  };

  const handleDismiss = () => {
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
        "fixed bottom-0 left-0 right-0 z-[100] p-4 w-full animate-in slide-in-from-bottom-full"
    )}>
        <Card className="max-w-md mx-auto shadow-2xl">
            <CardHeader>
                <CardTitle>Install Gymli App</CardTitle>
                <CardDescription>Get a richer experience by installing the app on your device.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
                <Button className="w-full font-bold" onClick={handleInstallClick}>
                    <Download className="mr-2"/>
                    Install
                </Button>
                <Button variant="outline" onClick={handleDismiss}>Not Now</Button>
            </CardContent>
             <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5"/>
             </button>
        </Card>
    </div>
  );
}
