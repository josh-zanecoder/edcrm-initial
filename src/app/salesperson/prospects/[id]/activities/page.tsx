"use client";

import React, { useState, useEffect } from "react";
import { Activity, ActivityStatus } from "@/types/activity";
import AddEditActivityModal from "@/components/salesperson/AddEditActivityModal";
import { useActivitiesStore } from "@/store/useActivityStore";

import {
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Pencil,
  AlertCircle,
  Loader2,
} from "lucide-react";

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
  const { id } = React.use(params);

  const {
    activities,
    isLoading,
    error,
    fetchActivities,
    addActivity,
    editActivity,
    deleteActivity,
  } = useActivitiesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) fetchActivities(id);
  }, [id, fetchActivities]);

  const handleAddActivity = async (
    activityData: Omit<Activity, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    await addActivity(id, activityData);
  };

  const handleEditActivity = async (
    activityData: Omit<Activity, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    if (!editingActivity) return;
    await editActivity(id, editingActivity._id, activityData);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteActivityId) return;
    setIsDeleting(true);
    await deleteActivity(id, deleteActivityId);
    setIsDeleting(false);
    setDeleteActivityId(null);
  };

  const handleEditClick = (activity: Activity) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };
  const handleDeleteClick = (activityId: string) => {
    setDeleteActivityId(activityId);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
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
        <Button onClick={() => fetchActivities(id)} className="mt-2">
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h1 className="text-lg font-medium">Activities</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Add Activity</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity) => (
          <Card key={activity._id}>
            <CardHeader className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{activity.title}</h3>
                <Badge variant={getStatusVariant(activity.status)}>
                  {activity.status}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditClick(activity)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(activity._id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                <Clock className="inline-block h-4 w-4 mr-1" />
                Due: {formatDate(activity.dueDate)}
              </p>
              {activity.completedAt && (
                <p>
                  <CheckCircle2 className="inline-block h-4 w-4 mr-1 text-green-500" />
                  Completed: {formatDate(activity.completedAt)}
                </p>
              )}
              <p>{activity.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center text-muted-foreground mt-10">
          <p>No activities found.</p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-2">
            Add Your First Activity
          </Button>
        </div>
      )}

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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this activity? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-white"
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
