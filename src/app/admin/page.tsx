"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CheckCircle2, Clock } from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 sm:h-9 w-64" />
          <Skeleton className="h-5 sm:h-6 w-48" />
        </div>

        {/* Activity Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-7 sm:h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6 sm:space-y-8">
              {/* Activity Item Skeletons */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 sm:gap-4">
                  <div className="relative">
                    <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
                    {i !== 3 && (
                      <div className="absolute left-[13px] sm:left-[15px] top-7 sm:top-8 h-[calc(100%+32px)] w-[2px] bg-border/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Sales Team Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor and manage your sales team
          </p>
        </div>
      </div>

      {/* Sales Team Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Recent Sales Team Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 sm:space-y-8">
            {/* Activity Item 1 */}
            <div className="relative flex items-start gap-3 sm:gap-4">
              <div className="relative">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center">
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
                </div>
                <div className="absolute left-[13px] sm:left-[15px] top-7 sm:top-8 h-[calc(100%+32px)] w-[2px] bg-border" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm text-muted-foreground break-words">
                  New salesperson{" "}
                  <span className="font-medium text-foreground">John Doe</span>{" "}
                  was added to the team
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <time dateTime="2024-04-27">1h ago</time>
                </div>
              </div>
            </div>

            {/* Activity Item 2 */}
            <div className="relative flex items-start gap-3 sm:gap-4">
              <div className="relative">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-50" />
                </div>
                <div className="absolute left-[13px] sm:left-[15px] top-7 sm:top-8 h-[calc(100%+32px)] w-[2px] bg-border" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm text-muted-foreground break-words">
                  Sales target achieved by{" "}
                  <span className="font-medium text-foreground">
                    Jane Smith
                  </span>
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <time dateTime="2024-04-26">2h ago</time>
                </div>
              </div>
            </div>

            {/* Activity Item 3 */}
            <div className="relative flex items-start gap-3 sm:gap-4">
              <div className="relative">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-amber-500 flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-50" />
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm text-muted-foreground break-words">
                  Monthly review completed for{" "}
                  <span className="font-medium text-foreground">
                    Mike Johnson
                  </span>
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <time dateTime="2024-04-25">1d ago</time>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
