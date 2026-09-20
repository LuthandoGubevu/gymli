
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { GymCapacityCard } from "@/components/gym-capacity-card";
import { AccessPassCard } from "@/components/access-pass-card";
import { BusiestTimesCard } from "@/components/busiest-times-card";
import { RankProgressCard } from "@/components/rank-progress-card";
import { AchievementsCard } from "@/components/achievements-card";
import { AiCoachCard } from "@/components/ai-coach-card";
import { usePersonalRecords } from "@/hooks/use-personal-records";
import { useToast } from "@/hooks/use-toast";
import { Trophy, PlusCircle, CalendarIcon, Pencil, Trash2 } from "lucide-react";
import type { PersonalRecord, WeightUnit } from "@/lib/types";

const prFormSchema = z.object({
    exercise: z.string().min(2, { message: "Exercise name must be at least 2 characters." }),
    value: z.coerce.number().positive({ message: "Enter a positive number." }),
    unit: z.enum(['kg', 'lb']),
    date: z.date({
        required_error: "A date for your PR is required.",
    }),
});

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { records, addRecord, updateRecord, deleteRecord } = usePersonalRecords();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PersonalRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
        router.push('/app/admin');
    }
  }, [user, router]);

  const form = useForm<z.infer<typeof prFormSchema>>({
    resolver: zodResolver(prFormSchema),
    defaultValues: {
      exercise: "",
      unit: "kg" as WeightUnit,
    },
  });

  const handleOpenChange = (open: boolean) => {
      setIsDialogOpen(open);
      if (!open) {
          setEditingRecord(null);
          form.reset({ exercise: "", value: undefined, unit: "kg", date: undefined });
      }
  };

  const handleAddClick = () => {
    setEditingRecord(null);
    form.reset({ exercise: "", value: undefined, unit: "kg", date: new Date() });
    setIsDialogOpen(true);
  };

  const handleEditClick = (record: PersonalRecord) => {
      setEditingRecord(record);
      form.reset({
          exercise: record.exercise,
          value: record.value,
          unit: record.unit,
          date: new Date(record.date),
      });
      setIsDialogOpen(true);
  };

  const handleDelete = async (record: PersonalRecord) => {
    setDeletingId(record.id);
    try {
      await deleteRecord(record.id);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete this record." });
    } finally {
      setDeletingId(null);
    }
  };

  async function onSubmit(data: z.infer<typeof prFormSchema>) {
    setIsSaving(true);
    try {
      const payload = { exercise: data.exercise, value: data.value, unit: data.unit, date: format(data.date, "yyyy-MM-dd") };
      if (editingRecord) {
        await updateRecord(editingRecord.id, payload);
      } else {
        await addRecord(payload);
      }
      toast({ title: "✅ Personal Record Saved" });
      handleOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not save your personal record." });
    } finally {
      setIsSaving(false);
    }
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
        <AchievementsCard />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AiCoachCard />
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
              {records.length > 0 ? records.map(pr => (
                <TableRow key={pr.id}>
                  <TableCell className="font-medium">{pr.exercise}</TableCell>
                  <TableCell>{pr.value} {pr.unit}</TableCell>
                  <TableCell>{pr.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(pr)}>
                       <Pencil className="h-4 w-4" />
                       <span className="sr-only">Edit PR</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(pr)} disabled={deletingId === pr.id}>
                       <Trash2 className="h-4 w-4 text-destructive" />
                       <span className="sr-only">Delete PR</span>
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
                      {editingRecord ? 'Update the details of your personal best.' : 'Log a new personal record.'}
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
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Weight</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="any" placeholder="100" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="unit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unit</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="kg">kg</SelectItem>
                                            <SelectItem value="lb">lb</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                      </div>
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
                          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Record'}</Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
