
"use client";

import { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { useClasses } from '@/hooks/use-classes';
import { ClassInfo, ClassName } from '@/lib/types';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon, Dumbbell } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedTime, setSelectedTime] = useState<string>('all');
  const [isBooking, setIsBooking] = useState<string | null>(null);

  const availableDays = useMemo(() => {
    return [...new Set(classes.map(c => c.day))];
  }, [classes]);

  const availableTimes = useMemo(() => {
    const times = classes.map(c => c.time);
    return [...new Set(times)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c =>
      (selectedDay === 'all' || c.day === selectedDay) &&
      (selectedTime === 'all' || c.time === selectedTime)
    );
  }, [classes, selectedDay, selectedTime]);

  const handleBooking = async (cls: ClassInfo) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You need to be logged in to book a class." });
      return;
    }
    setIsBooking(cls.id);
    try {
      await addDoc(collection(db, "classBookings"), {
        userId: user.uid,
        userName: user.displayName || "Unknown User",
        userEmail: user.email,
        classId: cls.id,
        className: cls.name,
        classTime: cls.time,
        classDay: cls.day,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      toast({
        title: "✅ Booking Requested",
        description: `Your request for ${cls.name} has been sent. You'll be notified upon confirmation.`,
      });
    } catch (error) {
      console.error("Error booking class:", error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "There was a problem requesting your booking. Please try again.",
      });
    } finally {
      setIsBooking(null);
    }
  };

  if (classesLoading) {
      return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Class Schedule</h1>
        <p className="text-muted-foreground">Book your spot in one of our classes.</p>
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
                <TableHead><Dumbbell className="inline-block mr-2 size-4"/>Class</TableHead>
                <TableHead><CalendarIcon className="inline-block mr-2 size-4"/>Day</TableHead>
                <TableHead><Clock className="inline-block mr-2 size-4"/>Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                    <TableRow key={cls.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                        <ClassBadge name={cls.name} />
                    </TableCell>
                    <TableCell>{cls.day}</TableCell>
                    <TableCell>{cls.time}</TableCell>
                    <TableCell className="text-right">
                        <Button
                          onClick={() => handleBooking(cls)}
                          size="sm"
                          disabled={!cls.name || cls.name === "Instructor Decides" || isBooking === cls.id}
                        >
                          {isBooking === cls.id ? 'Requesting...' : 'Request Booking'}
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        {classes.length === 0
                            ? "No classes scheduled yet."
                            : "No classes match your selection. Try a different filter."
                        }
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
