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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sales Team Management
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage your sales team
          </p>
        </div>
      </div>

      {/* Sales Team Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales Team Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Activity Item 1 */}
            <div className="relative flex items-start gap-4">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Plus className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="absolute left-4 top-8 h-full w-0.5 bg-border" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-muted-foreground">
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
            <div className="relative flex items-start gap-4">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-50" />
                </div>
                <div className="absolute left-4 top-8 h-full w-0.5 bg-border" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-muted-foreground">
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
            <div className="relative flex items-start gap-4">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-50" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-muted-foreground">
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
