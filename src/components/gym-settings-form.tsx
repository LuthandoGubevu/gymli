
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useGym } from '@/hooks/use-gym';
import { GYM_DOC_COLLECTION, GYM_DOC_ID, DEFAULT_GEOFENCE_METERS } from '@/lib/gym';
import { GymSettingsFormData, gymSettingsFormSchema } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Globe, MapPin, Loader2, Users, Tag, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Skeleton } from './ui/skeleton';

const defaultValues: GymSettingsFormData = {
  gymName: "", address: "", imageUrl: "",
  latitude: 0, longitude: 0, geofenceRadiusMeters: DEFAULT_GEOFENCE_METERS,
  waitTime: "", thresholdLow: 20, thresholdModerate: 50,
  thresholdPacked: 80, promotionTags: "", workoutFocusAreas: "",
  trainerOrGuestInfo: "", generalGymNotice: "", offerExpiryDate: undefined,
};

export function GymSettingsForm() {
  const { toast } = useToast();
  const { gym, isLoading } = useGym();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const form = useForm<GymSettingsFormData>({
    resolver: zodResolver(gymSettingsFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (gym) {
      form.reset({
        ...gym,
        offerExpiryDate: gym.offerExpiryDate ? gym.offerExpiryDate.toDate() : undefined,
      });
    }
  }, [gym, form]);

  const handleUseCurrentLocation = () => {
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('latitude', position.coords.latitude);
        form.setValue('longitude', position.coords.longitude);
        toast({ title: "Success", description: "Location fetched." });
        setIsGettingLocation(false);
      },
      () => {
        toast({ variant: "destructive", title: "Error", description: "Could not get location." });
        setIsGettingLocation(false);
      }
    );
  };

  const onSubmit = async (values: GymSettingsFormData) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      offerExpiryDate: values.offerExpiryDate ? Timestamp.fromDate(values.offerExpiryDate) : null,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, GYM_DOC_COLLECTION, GYM_DOC_ID), payload, { merge: true });
      toast({ title: '✅ Gym Updated', description: `${values.gymName} details have been saved.` });
    } catch (error) {
      console.error("Error saving gym details:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save gym details.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Gym Details</CardTitle>
        <CardDescription>Manage the details for your gym.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Globe className="text-primary"/>Basic Info</h3>
              <FormField control={form.control} name="gymName" render={({ field }) => (<FormItem><FormLabel>Gym Name</FormLabel><FormControl><Input placeholder="Gymli" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="123 Fitness Ave, Gymtown" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://placehold.co/600x400.png" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold flex items-center gap-2"><MapPin className="text-primary"/>Geolocation</h3><Button type="button" variant="outline" size="sm" onClick={handleUseCurrentLocation} disabled={isGettingLocation}>{isGettingLocation ? <Loader2 className="animate-spin" /> : "Use Current Location"}</Button></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="latitude" render={({ field }) => (<FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="any" placeholder="34.0522" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="longitude" render={({ field }) => (<FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="any" placeholder="-118.2437" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="geofenceRadiusMeters" render={({ field }) => (<FormItem><FormLabel>Check-in Radius (meters)</FormLabel><FormDescription>How close a member must be to auto check-in.</FormDescription><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="text-primary"/>Crowd & Capacity</h3>
              <FormField control={form.control} name="waitTime" render={({ field }) => (<FormItem><FormLabel>Estimated Wait Time</FormLabel><FormControl><Input placeholder="e.g., 5 mins" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div>
                <FormLabel>Crowd Status Thresholds</FormLabel><FormDescription>Set member count for each status.</FormDescription>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <FormField control={form.control} name="thresholdLow" render={({ field }) => (<FormItem><FormLabel className="text-xs text-green-400">Not Busy</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="thresholdModerate" render={({ field }) => (<FormItem><FormLabel className="text-xs text-yellow-400">Moderate</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="thresholdPacked" render={({ field }) => (<FormItem><FormLabel className="text-xs text-red-400">Packed</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Tag className="text-primary"/>Promotions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="promotionTags" render={({ field }) => (<FormItem><FormLabel>Promotion Tags</FormLabel><FormControl><Input placeholder="e.g., Free Protein Shake, Referral Bonus" {...field} /></FormControl><FormDescription>Comma-separated.</FormDescription></FormItem>)} />
                <FormField control={form.control} name="workoutFocusAreas" render={({ field }) => (<FormItem><FormLabel>Workout Focus Areas</FormLabel><FormControl><Input placeholder="e.g., Cardio, Strength Training, HIIT" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="trainerOrGuestInfo" render={({ field }) => (<FormItem><FormLabel>Trainer or Guest Info</FormLabel><FormControl><Input placeholder="e.g., Session with Coach Sipho" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="offerExpiryDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Offer Expiry Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<Clock className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="generalGymNotice" render={({ field }) => (<FormItem><FormLabel>General Gym Notice</FormLabel><FormControl><Textarea placeholder="e.g., Renovations this week" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 animate-spin" />}Save Changes</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
