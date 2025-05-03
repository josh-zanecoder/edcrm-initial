"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Users, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Reminder {
  _id: string;
  title: string;
  dueDate: string;
  type: string;
  prospectId: string;
}

interface Activity {
  _id: string;
  title: string;
  createdAt: string;
  type: string;
  prospectId: string;
}

interface DashboardStats {
  totalProspects: number;
  pendingReminders: number;
  upcomingReminders: Reminder[];
  recentActivities: Activity[];
}

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProspects: 0,
    pendingReminders: 0,
    upcomingReminders: [],
    recentActivities: [],
  });

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/salesperson/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const data = await response.json();
      setStats((prev) => ({
        ...prev,
        ...data.stats,
      }));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== "salesperson")) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Show nothing while checking auth
  if (isAuthLoading) {
    return null;
  }

  // Show nothing if not authenticated
  if (!user) {
    return null;
  }

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return diff < 24 * 60 * 60 * 1000; // less than 24 hours
  };

  return (
    <div className="space-y-6 p-6">
      {isLoading ? (
        // Skeleton loader
        <>
          {/* Stats Grid Skeleton */}
          <div className="grid auto-cols-fr grid-flow-col gap-6 overflow-x-auto pb-4">
            <Card className="min-w-[280px]">
              <CardHeader className="relative">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardFooter>
            </Card>

            <Card className="min-w-[280px]">
              <CardHeader className="relative">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardFooter>
            </Card>
          </div>

          {/* Quick Actions Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Reminders & Activities Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between p-4 rounded-lg border"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between p-4 rounded-lg border"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        // Actual dashboard content
        <>
          {/* Stats Grid */}
          <div className="grid auto-cols-fr grid-flow-col gap-6 overflow-x-auto pb-4">
            <Card className="min-w-[280px]">
              <CardHeader className="relative">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardDescription>Total Prospects</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                      {stats.totalProspects}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className="flex gap-1 rounded-lg text-xs"
                  >
                    <ArrowUpRight className="size-3" />
                    +12.5%
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Growing steadily <ArrowUpRight className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Compared to last month
                </div>
              </CardFooter>
            </Card>

            <Card className="min-w-[280px]">
              <CardHeader className="relative">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-yellow-500/10 p-3">
                    <Clock className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <CardDescription>Pending Tasks</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                      {stats.pendingReminders}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className="flex gap-1 rounded-lg text-xs"
                  >
                    <ArrowDownRight className="size-3" />
                    -20%
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Decreased this week <ArrowDownRight className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Good task completion rate
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => router.push("/salesperson/prospects")}
                  className="w-full"
                  variant="default"
                >
                  <EyeIcon className="mr-2 h-4 w-4" />
                  View All Prospects
                </Button>
                <Button
                  onClick={() => router.push("/salesperson/prospects")}
                  className="w-full"
                  variant="secondary"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add New Prospect
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reminders & Activities Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Reminders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Upcoming Reminders</CardTitle>
                <Button variant="ghost" className="text-sm">
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                {stats.upcomingReminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No upcoming reminders.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.upcomingReminders.map((reminder) => (
                      <div
                        key={reminder._id}
                        className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{reminder.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {reminder.type}
                          </p>
                          <time
                            className="text-sm text-muted-foreground"
                            dateTime={reminder.dueDate}
                          >
                            {new Date(reminder.dueDate).toLocaleString()}
                          </time>
                        </div>
                        {isDueSoon(reminder.dueDate) && (
                          <Badge
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            Due Soon
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Recent Activities</CardTitle>
                <Button variant="ghost" className="text-sm">
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                {stats.recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recent activities.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.recentActivities.map((activity) => (
                      <div
                        key={activity._id}
                        className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.type}
                          </p>
                          <time
                            className="text-sm text-muted-foreground"
                            dateTime={activity.createdAt}
                          >
                            {new Date(activity.createdAt).toLocaleString()}
                          </time>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
