
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useWorkoutLogs, useBodyMetrics } from "@/hooks/use-workout-logs";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, Dumbbell, Scale } from "lucide-react";

export default function WorkoutLogPage() {
  const { toast } = useToast();
  const { logs, addLog, deleteLog } = useWorkoutLogs();
  const { entries, addEntry } = useBodyMetrics();

  const [type, setType] = useState("");
  const [durationMin, setDurationMin] = useState("30");
  const [notes, setNotes] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [weightKg, setWeightKg] = useState("");
  const [isSavingWeight, setIsSavingWeight] = useState(false);

  const handleAddLog = async () => {
    if (!type.trim()) {
      toast({ variant: "destructive", title: "Workout type required" });
      return;
    }
    setIsSavingLog(true);
    try {
      await addLog({
        date: format(new Date(), "yyyy-MM-dd"),
        type: type.trim(),
        durationMin: parseInt(durationMin, 10) || 0,
        notes: notes.trim() || undefined,
      });
      setType("");
      setNotes("");
      toast({ title: "✅ Workout Logged" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not save your workout." });
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteLog(id);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete this entry." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddWeight = async () => {
    const value = parseFloat(weightKg);
    if (!Number.isFinite(value) || value <= 0) {
      toast({ variant: "destructive", title: "Invalid weight" });
      return;
    }
    setIsSavingWeight(true);
    try {
      await addEntry({ date: format(new Date(), "yyyy-MM-dd"), weightKg: value });
      setWeightKg("");
      toast({ title: "✅ Weight Logged" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not save your entry." });
    } finally {
      setIsSavingWeight(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Workout Log</h1>
        <p className="text-muted-foreground">Log your workouts and body weight manually - the foundation for future device sync.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Dumbbell className="text-primary" />Log a Workout</CardTitle>
          <CardDescription>Recorded for today.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input placeholder="e.g., Leg Day, 5k Run" value={type} onChange={(e) => setType(e.target.value)} />
            <Input type="number" min={1} placeholder="Duration (min)" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
            <Button onClick={handleAddLog} disabled={isSavingLog}>
              {isSavingLog ? <Loader2 className="mr-2 animate-spin" /> : <Plus className="mr-2 size-4" />}
              Log Workout
            </Button>
          </div>
          <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.date}</TableCell>
                    <TableCell className="font-medium">{log.type}</TableCell>
                    <TableCell>{log.durationMin} min</TableCell>
                    <TableCell className="text-muted-foreground">{log.notes || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteLog(log.id)} disabled={deletingId === log.id}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No workouts logged yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Scale className="text-primary" />Body Weight</CardTitle>
          <CardDescription>Track your weight over time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input type="number" step="any" placeholder="Weight (kg)" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
            <Button onClick={handleAddWeight} disabled={isSavingWeight}>
              {isSavingWeight ? <Loader2 className="mr-2 animate-spin" /> : <Plus className="mr-2 size-4" />}
              Log Weight
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length > 0 ? entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.weightKg} kg</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={2} className="h-24 text-center text-muted-foreground">No weight entries yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
