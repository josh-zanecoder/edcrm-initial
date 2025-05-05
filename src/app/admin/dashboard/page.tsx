"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Salesperson } from "@/types/salesperson";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Calendar, Users, UserPlus } from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalespersons = async () => {
      try {
        const response = await fetch("/api/admin/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch salespersons");
        }
        const data = await response.json();
        setSalespersons(data);
      } catch (error) {
        console.error("Error fetching salespersons:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch salespersons"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalespersons();
  }, []);

  const formatDate = (date: string) => {
    try {
      const parsedDate = parseISO(date);

      if (isToday(parsedDate)) return "Today";
      if (isYesterday(parsedDate)) return "Yesterday";

      return formatDistanceToNow(parsedDate, {
        addSuffix: true,
        includeSeconds: false,
      });
    } catch (error) {
      console.error("Invalid date:", error);
      return "Invalid date";
    }
  };

  const TimelineSkeletonItem = () => (
    <div className="relative pl-8 animate-in fade-in slide-in-from-right-5 duration-500">
      <div className="absolute left-2 top-4 w-4 h-4 -mt-2 rounded-full border-2 border-primary/30 bg-background animate-pulse" />
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-3 w-full">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-full space-y-8 p-8 pt-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border/50 animate-pulse" />
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <TimelineSkeletonItem key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-8 pt-6">
        <div className="rounded-lg border border-destructive/50 p-6 animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <Users className="h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">
              Error Loading Timeline
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-8 p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Team Timeline</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Track your team's growth and recent additions
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-border" />
        <div className="space-y-6">
          {salespersons.map((person, index) => (
            <div
              key={person.id}
              className={cn(
                "relative pl-8 animate-in fade-in slide-in-from-right-5",
                { "delay-150": index === 1 },
                { "delay-300": index === 2 },
                { "delay-450": index >= 3 }
              )}
            >
              <div className="absolute left-2 top-4 w-4 h-4 -mt-2 rounded-full border-2 border-primary bg-background ring-4 ring-background" />
              <Card className="transition-colors hover:bg-accent cursor-pointer group overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {person.first_name} {person.last_name}
                        </h3>
                        <Badge
                          variant={
                            person.status === "active" ? "default" : "secondary"
                          }
                          className={cn(
                            "transition-colors",
                            person.status === "active"
                              ? "bg-emerald-500/15 text-emerald-600 group-hover:bg-emerald-500/25"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {person.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Phone className="mr-2 h-4 w-4" />
                          {person.phone}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {formatDate(person.joinDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
