
"use client";

import { format } from "date-fns";
import { useNotices } from "@/hooks/use-notices";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone } from "lucide-react";

export default function NoticesPage() {
  const { notices, isLoading } = useNotices();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Notices</h1>
        <p className="text-muted-foreground">Announcements from the gym.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : notices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Megaphone className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">No notices right now. Check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id} className="shadow-md">
              <CardHeader>
                <CardTitle>{notice.title}</CardTitle>
                <CardDescription>
                  {notice.authorName}{notice.createdAt ? ` · ${format(notice.createdAt.toDate(), "PPP p")}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{notice.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
