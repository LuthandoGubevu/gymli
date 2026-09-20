
"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotices } from "@/hooks/use-notices";
import { Megaphone } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export function NoticesSummaryCard() {
  const { notices, isLoading } = useNotices(3);

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Notices</CardTitle>
        <Megaphone className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : notices.length === 0 ? (
          <CardDescription>No notices right now.</CardDescription>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="space-y-0.5">
              <p className="text-sm font-medium leading-tight">{notice.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{notice.body}</p>
              {notice.createdAt && (
                <p className="text-[11px] text-muted-foreground/70">
                  {formatDistanceToNow(notice.createdAt.toDate(), { addSuffix: true })}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/app/notices">View All Notices</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
