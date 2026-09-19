
"use client";

import { useState } from "react";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useClasses } from "@/hooks/use-classes";
import { ClassInfo, ClassName, Day } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, Trash2 } from "lucide-react";

const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const CLASS_NAMES: ClassName[] = [
  'Spinning', 'Step', 'Body Con', 'Box', 'HIIT', 'Small Group PT',
  'Instructor Decides', 'Only for the Brave',
];

export function ManageClassesForm() {
  const { classes, isLoading } = useClasses();
  const { toast } = useToast();

  const [day, setDay] = useState<Day>('Monday');
  const [time, setTime] = useState('06:00');
  const [name, setName] = useState<ClassName>('HIIT');
  const [capacity, setCapacity] = useState('12');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    const capacityNum = parseInt(capacity, 10);
    if (!Number.isFinite(capacityNum) || capacityNum <= 0) {
      toast({ variant: 'destructive', title: 'Invalid capacity', description: 'Capacity must be a positive number.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'classes'), { day, time, name, capacity: capacityNum });
      toast({ title: '✅ Class Added', description: `${name} on ${day} at ${time} has been added.` });
    } catch (error) {
      console.error("Error adding class:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add class.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cls: ClassInfo) => {
    setDeletingId(cls.id);
    try {
      await deleteDoc(doc(db, 'classes', cls.id));
      toast({ title: '✅ Class Removed', description: `${cls.name} on ${cls.day} has been removed.` });
    } catch (error) {
      console.error("Error deleting class:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove class.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Manage Classes</CardTitle>
        <CardDescription>Add or remove recurring weekly classes. Capacity governs the booking waitlist.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Select value={day} onValueChange={(v) => setDay(v as Day)}>
            <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <Select value={name} onValueChange={(v) => setName(v as ClassName)}>
            <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              {CLASS_NAMES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Capacity" />
        </div>
        <Button onClick={handleAdd} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Plus className="mr-2 size-4" />}
          Add Class
        </Button>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
              ) : classes.length > 0 ? (
                classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{cls.day}</TableCell>
                    <TableCell>{cls.time}</TableCell>
                    <TableCell>{cls.capacity ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cls)} disabled={deletingId === cls.id}>
                        {deletingId === cls.id ? <Loader2 className="animate-spin size-4" /> : <Trash2 className="size-4 text-destructive" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No classes yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
