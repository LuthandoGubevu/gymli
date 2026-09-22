
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, FormEvent } from "react";
import { collection, query, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { AdminDashboardOverview } from "@/components/admin-dashboard-overview";
import { usePendingBookings } from "@/hooks/use-pending-bookings";
import { cn } from "@/lib/utils";
import { GymSettingsForm } from "@/components/gym-settings-form";
import { ManageClassesForm } from "@/components/manage-classes-form";
import { ManageNoticesForm } from "@/components/admin/manage-notices-form";
import { cancelClassBooking } from "@/lib/waitlist";
import type { ClassBookingStatus } from "@/lib/types";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CalendarCheck, UserCheck, Loader2, BarChart2, Megaphone, Building2, Dumbbell } from "lucide-react";


type BookingStatus = 'pending' | 'accepted' | 'declined';

// Interface for Class Bookings
interface ClassBooking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  classId: string;
  className: string;
  classDay: string;
  classTime: string;
  classDate: string;
  slotId: string;
  status: ClassBookingStatus;
  waitlistPosition?: number;
  createdAt: Timestamp;
}

const classBookingBadgeVariant: Record<ClassBookingStatus, "default" | "secondary" | "destructive"> = {
  confirmed: "default",
  waitlisted: "secondary",
  cancelled: "destructive",
};

const ClassBookingStatusBadge = ({ status, waitlistPosition }: { status: ClassBookingStatus; waitlistPosition?: number }) => (
  <Badge variant={classBookingBadgeVariant[status]} className="capitalize">
    {status === 'waitlisted' && waitlistPosition ? `Waitlisted #${waitlistPosition}` : status}
  </Badge>
);

// Interface for Trainer Bookings
interface TrainerBooking {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    trainerId: string;
    trainerName: string;
    day: string;
    time: string;
    status: BookingStatus;
    createdAt: Timestamp;
}

// Interface for Chat Messages
const statusVariantMap: Record<BookingStatus, "default" | "secondary" | "destructive"> = {
  pending: "default",
  accepted: "secondary",
  declined: "destructive",
};

const StatusBadge = ({ status }: { status: BookingStatus }) => (
  <Badge variant={statusVariantMap[status]} className="capitalize">
    {status}
  </Badge>
);

// Class Bookings Manager Component
function ClassBookingsManager() {
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ClassBookingStatus | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, "classBookings"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClassBooking));
      setBookings(bookingsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching class bookings: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch bookings." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast, user]);

  const handleCancel = async (id: string) => {
    setUpdatingId(id);
    try {
      await cancelClassBooking(id);
      toast({ title: "Success", description: "Booking cancelled. Any waitlisted member has been promoted if there was room." });
    } catch (error) {
      console.error(`Error cancelling booking ${id}:`, error);
      toast({ variant: "destructive", title: "Error", description: "Failed to cancel booking." });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking =>
      (statusFilter === 'all' || booking.status === statusFilter)
    );
  }, [bookings, statusFilter]);

  return (
     <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarCheck/>Class Bookings</CardTitle>
          <CardDescription>Bookings confirm or waitlist automatically based on class capacity. Cancel a spot to promote the next waitlisted member.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex flex-wrap gap-4">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ClassBookingStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
           </div>
           <div className="overflow-x-auto">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading bookings...</TableCell></TableRow>
                  ) : filteredBookings.length > 0 ? (
                    filteredBookings.map(booking => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="font-medium">{booking.userName}</div>
                          <div className="text-sm text-muted-foreground">{booking.userEmail}</div>
                        </TableCell>
                        <TableCell>{booking.className}</TableCell>
                        <TableCell>{booking.classDate ?? booking.classDay}, {booking.classTime}</TableCell>
                        <TableCell><ClassBookingStatusBadge status={booking.status} waitlistPosition={booking.waitlistPosition} /></TableCell>
                        <TableCell className="text-right">
                          {booking.status !== 'cancelled' && (
                            <Button variant="destructive" size="sm" onClick={() => handleCancel(booking.id)} disabled={updatingId === booking.id}>
                              {updatingId === booking.id ? <Loader2 className="animate-spin" /> : 'Cancel'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No bookings found for the selected filters.</TableCell></TableRow>
                  )}
                </TableBody>
             </Table>
           </div>
        </CardContent>
      </Card>
  );
}

// Trainer Bookings Manager Component
function TrainerBookingsManager() {
    const [bookings, setBookings] = useState<TrainerBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            setBookings([]);
            setIsLoading(false);
            return;
        }

        const q = query(collection(db, "trainerBookings"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const bookingsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TrainerBooking));
            setBookings(bookingsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching trainer bookings: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch trainer bookings." });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast, user]);

    const handleUpdateStatus = async (id: string, status: BookingStatus) => {
        setUpdatingId(id);
        try {
            const bookingRef = doc(db, "trainerBookings", id);
            await updateDoc(bookingRef, { status });
            toast({ title: "Success", description: `Booking has been ${status}.` });
        } catch (error) {
            console.error(`Error updating trainer booking ${id} to ${status}:`, error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update booking status." });
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredBookings = useMemo(() => {
        return bookings.filter(booking =>
            (statusFilter === 'all' || booking.status === statusFilter)
        );
    }, [bookings, statusFilter]);

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCheck />Trainer Booking Requests</CardTitle>
                <CardDescription>Manage one-on-one training session requests from members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BookingStatus | 'all')}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Trainer</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading bookings...</TableCell></TableRow>
                            ) : filteredBookings.length > 0 ? (
                                filteredBookings.map(booking => (
                                    <TableRow key={booking.id}>
                                        <TableCell>
                                            <div className="font-medium">{booking.userName}</div>
                                            <div className="text-sm text-muted-foreground">{booking.userEmail}</div>
                                        </TableCell>
                                        <TableCell>{booking.trainerName}</TableCell>
                                        <TableCell>{booking.day}, {booking.time}</TableCell>
                                        <TableCell><StatusBadge status={booking.status} /></TableCell>
                                        <TableCell className="text-right">
                                            {booking.status === 'pending' && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(booking.id, 'accepted')} disabled={updatingId === booking.id}>
                                                        {updatingId === booking.id ? <Loader2 className="animate-spin" /> : 'Accept'}
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(booking.id, 'declined')} disabled={updatingId === booking.id}>
                                                        {updatingId === booking.id ? <Loader2 className="animate-spin" /> : 'Decline'}
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No trainer bookings found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// Main Admin Page Component
export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { pendingClassBookings, pendingTrainerBookings } = usePendingBookings();
    const [activeTab, setActiveTab] = useState('analytics');

    const adminNavItems = [
      { id: 'analytics', label: 'Analytics', icon: BarChart2, badge: 0 },
      { id: 'notices', label: 'Notices', icon: Megaphone, badge: 0 },
      { id: 'class-bookings', label: 'Classes', icon: CalendarCheck, badge: pendingClassBookings },
      { id: 'trainer-bookings', label: 'Trainers', icon: UserCheck, badge: pendingTrainerBookings },
      { id: 'manage-classes', label: 'Manage Classes', icon: Dumbbell, badge: 0 },
      { id: 'gym-settings', label: 'Gym', icon: Building2, badge: 0 },
    ];

    useEffect(() => {
        if (!loading && user?.role !== 'admin') {
            router.push('/app');
        }
    }, [user, loading, router]);

    if (loading || user?.role !== 'admin') {
        return (
             <div className="flex h-full w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-muted-foreground">Verifying permissions...</p>
                </div>
             </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 md:pb-8">
            <div>
                <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
                    <ShieldCheck className="text-primary size-8" />
                    Admin Panel
                </h1>
                <p className="text-muted-foreground break-words">Shared dashboard for managing all gym operations.</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="hidden h-auto w-full grid-cols-1 sm:grid-cols-2 md:grid md:grid-cols-3 lg:h-10 lg:grid-cols-7">
                <TabsTrigger value="analytics">
                    <BarChart2 className="mr-2 size-4"/>
                    Analytics
                </TabsTrigger>
                <TabsTrigger value="notices">
                    <Megaphone className="mr-2 size-4"/>
                    Notices
                </TabsTrigger>
                <TabsTrigger value="class-bookings" className="relative">
                    Class Bookings
                    {pendingClassBookings > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{pendingClassBookings}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="trainer-bookings" className="relative">
                    Trainer Bookings
                    {pendingTrainerBookings > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{pendingTrainerBookings}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="manage-classes">
                    <Dumbbell className="mr-2 size-4"/>
                    Manage Classes
                </TabsTrigger>
                <TabsTrigger value="gym-settings">
                    <Building2 className="mr-2 size-4"/>
                    Gym Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="analytics" className="mt-4">
                 <AdminDashboardOverview />
              </TabsContent>
              <TabsContent value="notices" className="mt-4">
                 <ManageNoticesForm />
              </TabsContent>
              <TabsContent value="class-bookings" className="mt-4">
                <ClassBookingsManager />
              </TabsContent>
              <TabsContent value="trainer-bookings" className="mt-4">
                 <TrainerBookingsManager />
              </TabsContent>
              <TabsContent value="manage-classes" className="mt-4">
                 <ManageClassesForm />
              </TabsContent>
              <TabsContent value="gym-settings" className="mt-4">
                 <GymSettingsForm />
              </TabsContent>
            </Tabs>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 bg-background/90 backdrop-blur-sm md:hidden">
              <div className="flex h-16 items-center justify-around">
                {adminNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 p-2 text-sm font-medium transition-colors relative',
                      activeTab === item.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-label={item.label}
                  >
                    <item.icon className="size-6" />
                    <span className="text-xs">{item.label}</span>
                    {item.badge > 0 && 
                      <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 p-0 text-xs flex items-center justify-center translate-x-1/2 -translate-y-1/2">
                        {item.badge}
                      </Badge>
                    }
                  </button>
                ))}
              </div>
            </nav>
        </div>
    );
}
