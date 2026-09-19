
"use client";

import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { useClasses } from '@/hooks/use-classes';
import { useClassSlots } from '@/hooks/use-class-slots';
import { useMyClassBookings } from '@/hooks/use-my-class-bookings';
import { getAllUpcomingOccurrences } from '@/lib/occurrences';
import { bookClass, cancelClassBooking } from '@/lib/waitlist';
import { ClassName } from '@/lib/types';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon, Dumbbell } from 'lucide-react';

const classColorMap: Record<ClassName, string> = {
  'HIIT': 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
  'Spinning': 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  'Spinn': 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  'Body Con': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
  'Box': 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
  'Step': 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
  'Small Group PT': 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
  'Instructor Decides': 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30',
  'Only for the Brave': 'bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30',
  '': 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30',
};

const ClassBadge = ({ name }: { name: ClassName }) => {
  if (!name) return null;
  return (
    <Badge variant="outline" className={cn("font-semibold", classColorMap[name])}>
      {name}
    </Badge>
  );
};

export default function ClassesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { classes, isLoading: classesLoading } = useClasses();
  const { slots } = useClassSlots();
  const { bookingsBySlot } = useMyClassBookings();

  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedTime, setSelectedTime] = useState<string>('all');
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);

  const occurrences = useMemo(() => getAllUpcomingOccurrences(classes, 8), [classes]);
  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  const availableDays = useMemo(() => [...new Set(classes.map((c) => c.day))], [classes]);
  const availableTimes = useMemo(() => {
    const times = classes.map((c) => c.time);
    return [...new Set(times)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [classes]);

  const filteredOccurrences = useMemo(() => {
    return occurrences.filter((occ) => {
      const cls = classById.get(occ.classId);
      if (!cls) return false;
      return (selectedDay === 'all' || cls.day === selectedDay) &&
        (selectedTime === 'all' || cls.time === selectedTime);
    });
  }, [occurrences, classById, selectedDay, selectedTime]);

  const handleBooking = async (occ: { slotId: string; classId: string; date: string }) => {
    const cls = classById.get(occ.classId);
    if (!cls) return;
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You need to be logged in to book a class." });
      return;
    }
    setPendingSlotId(occ.slotId);
    try {
      const result = await bookClass({
        userId: user.uid,
        userName: user.displayName || "Unknown User",
        userEmail: user.email,
        cls,
        date: occ.date,
        slotId: occ.slotId,
      });
      toast({
        title: result.status === 'confirmed' ? '✅ Booking Confirmed' : '⏳ Added to Waitlist',
        description: result.status === 'confirmed'
          ? `You're confirmed for ${cls.name} on ${occ.date}.`
          : `${cls.name} is full. You're #${result.waitlistPosition} on the waitlist - we'll notify you if a spot opens up.`,
      });
    } catch (error) {
      console.error("Error booking class:", error);
      toast({ variant: "destructive", title: "Booking Failed", description: "There was a problem requesting your booking. Please try again." });
    } finally {
      setPendingSlotId(null);
    }
  };

  const handleCancel = async (bookingId: string, slotId: string) => {
    setPendingSlotId(slotId);
    try {
      await cancelClassBooking(bookingId);
      toast({ title: "Booking Cancelled", description: "Your spot has been released." });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not cancel your booking." });
    } finally {
      setPendingSlotId(null);
    }
  };

  if (classesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Class Schedule</h1>
        <p className="text-muted-foreground">Book your spot in one of our classes, up to 8 days ahead.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filter Classes</CardTitle>
          <CardDescription>Find the perfect class for your schedule.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-2 block" htmlFor="day-select">Day of the week</label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger id="day-select">
                <CalendarIcon className="mr-2 size-4" />
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                {availableDays.map(day => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block" htmlFor="time-select">Time slot</label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger id="time-select">
                <Clock className="mr-2 size-4" />
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Times</SelectItem>
                {availableTimes.map(time => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Dumbbell className="inline-block mr-2 size-4" />Class</TableHead>
                <TableHead><CalendarIcon className="inline-block mr-2 size-4" />Date</TableHead>
                <TableHead><Clock className="inline-block mr-2 size-4" />Time</TableHead>
                <TableHead>Spots</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOccurrences.length > 0 ? (
                filteredOccurrences.map((occ) => {
                  const cls = classById.get(occ.classId)!;
                  const slot = slots[occ.slotId];
                  const confirmedCount = slot?.confirmedCount ?? 0;
                  const isFull = confirmedCount >= cls.capacity;
                  const myBooking = bookingsBySlot[occ.slotId];
                  const isPending = pendingSlotId === occ.slotId;
                  const isBookable = !!cls.name && cls.name !== "Instructor Decides";

                  return (
                    <TableRow key={occ.slotId} className="hover:bg-muted/50">
                      <TableCell className="font-medium"><ClassBadge name={cls.name} /></TableCell>
                      <TableCell>{format(parseISO(occ.date), 'EEE, MMM d')}</TableCell>
                      <TableCell>{cls.time}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{confirmedCount}/{cls.capacity}</TableCell>
                      <TableCell className="text-right">
                        {myBooking ? (
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant={myBooking.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                              {myBooking.status === 'waitlisted' ? `Waitlisted #${myBooking.waitlistPosition}` : myBooking.status}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => handleCancel(myBooking.id, occ.slotId)} disabled={isPending}>
                              {isPending ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={() => handleBooking(occ)} size="sm" disabled={!isBookable || isPending}>
                            {isPending ? 'Booking...' : isFull ? 'Join Waitlist' : 'Book'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {classes.length === 0
                      ? "No classes scheduled yet."
                      : "No classes match your selection. Try a different filter."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
