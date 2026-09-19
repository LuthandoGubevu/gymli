"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, UserPlus, UsersRound } from "lucide-react"
import { useGymOccupancy } from "@/hooks/use-gym-occupancy"
import { useGym } from "@/hooks/use-gym"
import { getCrowdLevel } from "@/lib/crowd"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "./ui/skeleton"

export function AdminDashboardOverview() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [newMembersThisWeek, setNewMembersThisWeek] = useState(0);
  const [isLoadingNewMembers, setIsLoadingNewMembers] = useState(true);

  const { gym } = useGym();
  const { occupancy, isLoading: occupancyLoading } = useGymOccupancy();

  const isLoading = occupancyLoading;
  const crowdStatus = gym ? getCrowdLevel(occupancy, gym) : null;

  useEffect(() => {
    const fetchTotalUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const usersCollectionRef = collection(db, "users");
        const querySnapshot = await getDocs(usersCollectionRef);
        setTotalUsers(querySnapshot.size);
      } catch (error) {
        console.error("Error fetching total users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const fetchNewMembers = async () => {
      setIsLoadingNewMembers(true);
      try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoTimestamp = Timestamp.fromDate(oneWeekAgo);

        const usersCollectionRef = collection(db, "users");
        const q = query(usersCollectionRef, where("createdAt", ">=", oneWeekAgoTimestamp));

        const querySnapshot = await getDocs(q);
        setNewMembersThisWeek(querySnapshot.size);
      } catch (error) {
        console.error("Error fetching new members:", error);
      } finally {
        setIsLoadingNewMembers(false);
      }
    };

    fetchTotalUsers();
    fetchNewMembers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{occupancy.toLocaleString()}</div>
                {crowdStatus && <Badge variant="outline" className={crowdStatus.badgeClass}>{crowdStatus.label}</Badge>}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Members currently checked in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Members This Week</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingNewMembers ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">+{newMembersThisWeek}</div>}
            <p className="text-xs text-muted-foreground">Keep up the growth!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Users</CardTitle>
            <UsersRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>}
            <p className="text-xs text-muted-foreground">All-time registered members.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
