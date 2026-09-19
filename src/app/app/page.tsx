
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { GymCapacityCard } from "@/components/gym-capacity-card";
import { AccessPassCard } from "@/components/access-pass-card";
import { BusiestTimesCard } from "@/components/busiest-times-card";
import { RankProgressCard } from "@/components/rank-progress-card";
import { Trophy, Award, Medal, Star, Flame, Zap, Check, PlusCircle, CalendarIcon, Pencil } from "lucide-react";

interface PersonalRecord {
  id: string;
  exercise: string;
  weight: string;
  date: string;
}

const initialPrs: PersonalRecord[] = [
  { id: 'pr1', exercise: 'Bench Press', weight: '100 kg', date: '2024-07-15' },
  { id: 'pr2', exercise: 'Squat', weight: '140 kg', date: '2024-07-10' },
  { id: 'pr3', exercise: 'Deadlift', weight: '180 kg', date: '2024-07-12' },
];

const mockAchievements = [
  { id: 1, name: 'First 5 Visits', icon: Star, description: 'Completed your first 5 workouts.', achieved: true },
  { id: 2, name: 'Month Challenger', icon: Medal, description: 'Visited 12 times in a month.', achieved: true },
  { id: 3, name: 'Early Bird', icon: Flame, description: 'Completed 10 morning workouts.', achieved: false },
  { id: 4, name: 'HIIT Expert', icon: Zap, description: 'Attended 5 HIIT classes.', achieved: true },
  { id: 5, name: 'Consistent Kilo', icon: Trophy, description: 'Lifted over 10,000kg in a month.', achieved: true },
  { id: 6, name: 'New PR!', icon: Award, description: 'Set a new personal record.', achieved: true },
];

const prFormSchema = z.object({
    exercise: z.string().min(2, { message: "Exercise name must be at least 2 characters." }),
    weight: z.string().min(2, { message: "Please include units (e.g., kg, lbs)." }),
    date: z.date({
        required_error: "A date for your PR is required.",
    }),
});

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>(initialPrs);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PersonalRecord | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
        router.push('/app/admin');
    }
  }, [user, router]);

  const form = useForm<z.infer<typeof prFormSchema>>({
    resolver: zodResolver(prFormSchema),
    defaultValues: {
      exercise: "",
      weight: "",
    },
  });

  const handleOpenChange = (open: boolean) => {
      setIsDialogOpen(open);
      if (!open) {
          setEditingRecord(null);
          form.reset({ exercise: "", weight: "", date: undefined });
      }
  };

  const handleAddClick = () => {
    setEditingRecord(null);
    form.reset({ exercise: "", weight: "", date: new Date() });
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (record: PersonalRecord) => {
      setEditingRecord(record);
      form.reset({
          exercise: record.exercise,
          weight: record.weight,
          date: new Date(record.date),
      });
      setIsDialogOpen(true);
  };

  function onSubmit(data: z.infer<typeof prFormSchema>) {
    const newRecordData = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
    };

    if (editingRecord) {
        // Update the existing PR by its ID
        setPersonalRecords(prevRecords => 
            prevRecords.map(pr => pr.id === editingRecord.id ? { ...pr, ...newRecordData } : pr)
        );
    } else {
        // Add a new PR, or update if exercise name already exists
        const existingPrIndex = personalRecords.findIndex(pr => pr.exercise.toLowerCase() === data.exercise.toLowerCase());
        if (existingPrIndex !== -1) {
           setPersonalRecords(prevRecords => {
               const updatedRecords = [...prevRecords];
               updatedRecords[existingPrIndex] = { ...updatedRecords[existingPrIndex], ...newRecordData };
               return updatedRecords;
           });
        } else {
            setPersonalRecords(prevRecords => [...prevRecords, { ...newRecordData, id: `pr${Date.now()}` }]);
        }
    }
    
    handleOpenChange(false);
  }

  if (user?.role === 'admin') {
    return (
         <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-muted-foreground">Redirecting to admin panel...</p>
            </div>
         </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold md:text-3xl">Welcome back, {user?.displayName || "Champion"}!</CardTitle>
          <CardDescription>Ready to crush your goals today?</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GymCapacityCard />
        <AccessPassCard />
        <BusiestTimesCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RankProgressCard />
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="text-primary"/>Achievements</CardTitle>
                <CardDescription>Milestones you've unlocked.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-3">
              {mockAchievements.slice(0, 6).map(ach => (
                <div key={ach.id} className="flex flex-col items-center text-center gap-2" title={ach.description}>
                   <div className="relative">
                      <ach.icon className={`size-10 ${ach.achieved ? 'text-primary' : 'text-muted-foreground/50'}`} />
                      {ach.achieved && <Check className="absolute -bottom-1 -right-1 size-5 rounded-full bg-green-500 text-white p-0.5" />}
                   </div>
                   <p className={`text-xs ${ach.achieved ? 'text-foreground' : 'text-muted-foreground'}`}>{ach.name}</p>
                </div>
              ))}
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                    <CardTitle className="flex items-center gap-2"><Trophy className="text-primary"/>Personal Records</CardTitle>
                    <CardDescription>Your all-time best lifts. Keep pushing!</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddClick}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add PR
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exercise</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personalRecords.length > 0 ? personalRecords.map(pr => (
                <TableRow key={pr.id}>
                  <TableCell className="font-medium">{pr.exercise}</TableCell>
                  <TableCell>{pr.weight}</TableCell>
                  <TableCell>{pr.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(pr)}>
                       <Pencil className="h-4 w-4" />
                       <span className="sr-only">Edit PR</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No personal records logged yet. Add one!
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{editingRecord ? 'Edit Personal Record' : 'Add New Personal Record'}</DialogTitle>
                  <DialogDescription>
                      {editingRecord ? 'Update the details of your personal best.' : 'Log a new PR. If the exercise exists, it will be updated.'}
                  </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                      <FormField
                          control={form.control}
                          name="exercise"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Exercise</FormLabel>
                                  <FormControl>
                                      <Input placeholder="e.g., Bench Press" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="weight"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Weight</FormLabel>
                                  <FormControl>
                                      <Input placeholder="e.g., 105 kg" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                              <FormItem className="flex flex-col">
                                  <FormLabel>Date</FormLabel>
                                  <Popover>
                                      <PopoverTrigger asChild>
                                          <FormControl>
                                              <Button
                                                  variant={"outline"}
                                                  className={cn(
                                                      "w-full pl-3 text-left font-normal",
                                                      !field.value && "text-muted-foreground"
                                                  )}
                                              >
                                                  {field.value ? (
                                                      format(field.value, "PPP")
                                                  ) : (
                                                      <span>Pick a date</span>
                                                  )}
                                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                              </Button>
                                          </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                              mode="single"
                                              selected={field.value}
                                              onSelect={field.onChange}
                                              disabled={(date) =>
                                                  date > new Date() || date < new Date("1900-01-01")
                                              }
                                              initialFocus
                                          />
                                      </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <DialogFooter>
                          <Button type="submit">Save Record</Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
