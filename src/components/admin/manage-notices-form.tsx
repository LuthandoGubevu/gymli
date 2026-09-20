
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useNotices } from "@/hooks/use-notices";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Trash2 } from "lucide-react";

export function ManageNoticesForm() {
  const { user } = useAuth();
  const { notices, isLoading } = useNotices();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handlePost = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ variant: "destructive", title: "Title and body are required" });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "notices"), {
        title: title.trim(),
        body: body.trim(),
        authorName: user?.displayName || "Gymli Admin",
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setBody("");
      toast({ title: "✅ Notice Posted" });
    } catch (error) {
      console.error("Error posting notice:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to post notice." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "notices", id));
      toast({ title: "✅ Notice Removed" });
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to remove notice." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Notices</CardTitle>
        <CardDescription>Post an announcement for members - closures, promotions, schedule changes, anything.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} />
          <Textarea placeholder="What would you like to announce?" value={body} onChange={(e) => setBody(e.target.value)} disabled={isSubmitting} />
          <Button onClick={handlePost} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2 size-4" />}
            Post Notice
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Posted Notices</h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : notices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notices posted yet.</p>
          ) : (
            notices.map((notice) => (
              <div key={notice.id} className="flex items-start justify-between gap-4 rounded-md border p-3">
                <div>
                  <p className="font-medium">{notice.title}</p>
                  <p className="text-sm text-muted-foreground">{notice.body}</p>
                  {notice.createdAt && (
                    <p className="mt-1 text-xs text-muted-foreground/70">{format(notice.createdAt.toDate(), "PPP p")}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(notice.id)} disabled={deletingId === notice.id}>
                  {deletingId === notice.id ? <Loader2 className="animate-spin size-4" /> : <Trash2 className="size-4 text-destructive" />}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
