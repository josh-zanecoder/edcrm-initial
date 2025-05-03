"use client";

import React, { useState, useEffect } from "react";
import { Activity, ActivityStatus } from "@/types/activity";
import AddEditActivityModal from "@/components/salesperson/AddEditActivityModal";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Pencil,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatDate(date: Date | string) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusVariant(status: ActivityStatus) {
  switch (status) {
    case ActivityStatus.COMPLETED:
      return "completed";
    case ActivityStatus.IN_PROGRESS:
      return "default";
    case ActivityStatus.CANCELLED:
      return "destructive";
    default:
      return "secondary";
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ActivitiesPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchActivities = React.useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch(`/api/prospects/${id}/activities`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch activities");
      }
      const activitiesData = await response.json();
      setActivities(activitiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Failed to load activities");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchActivities();
    }
  }, [id, fetchActivities]);

  const handleAddActivity = async (
    activity: Omit<Activity, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    try {
      const response = await fetch(`/api/prospects/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...activity,
          dueDate: activity.dueDate.toISOString(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add activity");
      }
      setIsModalOpen(false);
      await fetchActivities();
    } catch (err) {
      console.error("Error adding activity:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add activity"
      );
    }
  };

  const handleDeleteClick = (activityId: string) => {
    setDeleteActivityId(activityId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteActivityId) return;

    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting activity...");

    try {
      const response = await fetch(
        `/api/prospects/${id}/activities/${deleteActivityId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete activity");
      }

      setActivities((prevActivities) =>
        prevActivities.filter((activity) => activity._id !== deleteActivityId)
      );
      toast.success("Activity removed successfully", {
        id: loadingToast,
      });
    } catch (err) {
      console.error("Error deleting activity:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete activity",
        {
          id: loadingToast,
        }
      );
      fetchActivities();
    } finally {
      setIsDeleting(false);
      setDeleteActivityId(null);
    }
  };

  const handleEditClick = (activity: Activity) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };

  const handleEditActivity = async (
    activity: Omit<Activity, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    if (!editingActivity) return;
    try {
      const response = await fetch(
        `/api/prospects/${id}/activities/${editingActivity._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...activity,
            dueDate: activity.dueDate.toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update activity");
      }

      setIsEditModalOpen(false);
      setEditingActivity(null);
      await fetchActivities();
    } catch (err) {
      console.error("Error updating activity:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update activity"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 sm:h-5 w-4 sm:w-5" />
            <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
          </div>
          <Skeleton className="h-8 sm:h-9 w-20 sm:w-24" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="overflow-hidden border-border/5 bg-card shadow-none"
            >
              <CardHeader className="border-b border-border/5 bg-card p-2.5 sm:p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <Skeleton className="h-4 sm:h-5 w-28 sm:w-32 mb-1.5 sm:mb-2" />
                    <Skeleton className="h-4 sm:h-5 w-16 sm:w-20" />
                  </div>
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <Skeleton className="h-7 w-7 sm:h-8 sm:w-8" />
                    <Skeleton className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 bg-card p-2.5 sm:p-4 pt-2 sm:pt-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <Skeleton className="h-3.5 w-20 sm:h-4 sm:w-24" />
                </div>
                <Skeleton className="h-3.5 sm:h-4 w-full mt-1.5 sm:mt-2" />
                <Skeleton className="h-3.5 sm:h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl m-3 sm:m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Activities</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchActivities}
          className="mt-2"
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
          <h1 className="text-base sm:text-lg font-medium">Activities</h1>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="h-8 sm:h-9 text-xs sm:text-sm"
        >
          Add Activity
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <Card
            key={activity._id}
            className="overflow-hidden border-border/5 bg-card shadow-none hover:shadow-sm transition-shadow"
          >
            <CardHeader className="border-b border-border/5 bg-card p-3 sm:p-4">
              <div className="relative flex flex-col w-full">
                <div className="flex items-start justify-between w-full">
                  <h3 className="text-sm font-medium text-card-foreground break-all pr-16 sm:pr-20">
                    {activity.title}
                  </h3>
                  <div className="flex items-start gap-1 absolute right-0 top-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteClick(activity._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                      onClick={() => handleEditClick(activity)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Badge
                  variant={getStatusVariant(activity.status)}
                  className="mt-1.5 w-fit text-[10px] sm:text-xs font-normal"
                >
                  {activity.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 bg-card p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">
                  Due: {formatDate(activity.dueDate)}
                </span>
              </div>
              {activity.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                  <span className="text-xs text-muted-foreground truncate">
                    Completed: {formatDate(activity.completedAt)}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground break-words leading-relaxed">
                {activity.description}
              </p>
            </CardContent>
          </Card>
        ))}

        {activities.length === 0 && (
          <Card className="col-span-full border-border/5 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-primary/20" />
              <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-medium text-card-foreground">
                No activities yet
              </h3>
              <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-center text-muted-foreground max-w-[240px] sm:max-w-[280px]">
                Get started by adding a new activity.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="h-8 sm:h-9 text-xs sm:text-sm"
              >
                Add First Activity
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AddEditActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddActivity}
        prospectId={id}
      />

      <AddEditActivityModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingActivity(null);
        }}
        onSave={handleEditActivity}
        prospectId={id}
        initialData={editingActivity || undefined}
        mode="edit"
      />

      <AlertDialog
        open={!!deleteActivityId}
        onOpenChange={() => setDeleteActivityId(null)}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              activity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
