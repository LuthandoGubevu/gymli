
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useGym } from "@/hooks/use-gym";
import { updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { maybeUpdateLeaderboard, removeFromLeaderboard } from "@/lib/gamification";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email(),
  fitnessGoals: z.string().max(200, { message: "Goals can be up to 200 characters." }).optional(),
  bio: z.string().max(160, { message: "Bio can be up to 160 characters." }).optional(),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUpdatingLeaderboard, setIsUpdatingLeaderboard] = useState(false);
  const [isUpdatingBuddyOptIn, setIsUpdatingBuddyOptIn] = useState(false);
  const { gym } = useGym();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      fitnessGoals: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/app/admin');
        return;
      }
      const fetchUserData = async () => {
        setIsFetching(true);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          form.reset({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            username: userData.username || "",
            email: userData.email || user.email || "",
            fitnessGoals: userData.fitnessGoals || "",
            bio: userData.bio || "",
          });
        }
        setIsFetching(false);
      };
      fetchUserData();
    }
  }, [user, form, router]);

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user || !auth.currentUser) {
      toast({ variant: "destructive", title: "Not authenticated" });
      return;
    }
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const displayName = `${values.firstName} ${values.lastName}`;

      // Update Firestore
      await updateDoc(userDocRef, {
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        fitnessGoals: values.fitnessGoals,
        bio: values.bio,
      });

      // Update Firebase Auth profile
      if (auth.currentUser.displayName !== displayName) {
          await updateProfile(auth.currentUser, { displayName });
      }

      toast({
        title: "Profile Updated",
        description: "Your information has been successfully saved.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleLeaderboardOptInChange = async (checked: boolean) => {
    if (!user) return;
    setIsUpdatingLeaderboard(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { leaderboardOptIn: checked });
      if (checked) {
        await maybeUpdateLeaderboard(user.uid);
      } else {
        await removeFromLeaderboard(user.uid);
      }
      user.leaderboardOptIn = checked;
      toast({ title: "Preference Updated", description: `Leaderboard visibility has been ${checked ? 'enabled' : 'disabled'}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save your preference." });
    } finally {
      setIsUpdatingLeaderboard(false);
    }
  };

  const handleBuddyOptInChange = async (checked: boolean) => {
    if (!user) return;
    setIsUpdatingBuddyOptIn(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { buddyOptIn: checked });
      user.buddyOptIn = checked;
      toast({ title: "Preference Updated", description: `Gym Buddy has been ${checked ? 'turned on' : 'turned off'}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save your preference." });
    } finally {
      setIsUpdatingBuddyOptIn(false);
    }
  };

  if (isFetching || user?.role === 'admin') {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Manage your personal information and goals.</CardDescription>
        </CardHeader>
      </Card>
      <Card className="shadow-lg max-w-2xl">
        <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Keep your profile up to date.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                            <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                  />
                </div>
                 <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="johndoe" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                          <Input disabled {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Gym</FormLabel>
                  <FormControl>
                    <Input disabled value={gym?.gymName || "Gymli"} />
                  </FormControl>
                </FormItem>
                <FormField
                  control={form.control}
                  name="fitnessGoals"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Fitness Goals</FormLabel>
                      <FormControl>
                          <Textarea
                          placeholder="e.g., Run a 5k, build muscle, improve flexibility"
                          className="resize-none"
                          {...field}
                          />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Short Bio</FormLabel>
                      <FormControl>
                          <Textarea
                          placeholder="A line about your training style or what you're looking for"
                          className="resize-none"
                          {...field}
                          />
                      </FormControl>
                      <FormDescription>Shown on your Gym Buddy card, if you opt in below.</FormDescription>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <Button type="submit" className="font-bold" size="lg" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
        <Card className="shadow-lg max-w-2xl">
            <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>Show your visits and streak on the gym-wide monthly leaderboard.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="leaderboard-opt-in"
                        checked={user?.leaderboardOptIn ?? false}
                        onCheckedChange={handleLeaderboardOptInChange}
                        disabled={isUpdatingLeaderboard}
                    />
                    <Label htmlFor="leaderboard-opt-in">Appear on the leaderboard</Label>
                </div>
            </CardContent>
        </Card>
        <Card className="shadow-lg max-w-2xl">
            <CardHeader>
                <CardTitle>Gym Buddy</CardTitle>
                <CardDescription>Let other members discover and match with you to train together.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="buddy-opt-in"
                        checked={user?.buddyOptIn ?? false}
                        onCheckedChange={handleBuddyOptInChange}
                        disabled={isUpdatingBuddyOptIn}
                    />
                    <Label htmlFor="buddy-opt-in">Show my profile in Gym Buddy</Label>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

function ProfileSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-80 mt-2" />
                </CardHeader>
            </Card>
            <Card className="shadow-lg max-w-2xl">
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <Skeleton className="h-12 w-32" />
                </CardContent>
            </Card>
        </div>
    );
}
