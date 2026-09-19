
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

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email(),
  fitnessGoals: z.string().max(200, { message: "Goals can be up to 200 characters." }).optional(),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { gym } = useGym();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      fitnessGoals: "",
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
                <Button type="submit" className="font-bold" size="lg" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
                </Button>
            </form>
            </Form>
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
