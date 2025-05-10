"use client";

import React, { useState, useEffect, useRef } from "react";
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
  // Track if we've just closed the modal
  const modalJustClosed = useRef(false);

  const {
    activities,
    isLoading,
    isOperationInProgress,
    preventModalReopen,
    error,
    fetchActivities,
    addActivity,
    editActivity,
    deleteActivity,
    resetPreventModalReopen,
  } = useActivitiesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) fetchActivities(id);
  }, [id, fetchActivities]);

  // Critical effect to prevent modal reopening
  useEffect(() => {
    if (preventModalReopen) {
      // Ensure modals stay closed when preventModalReopen is true
      setIsModalOpen(false);
      setIsEditModalOpen(false);

      // Use a timeout to reset the flag after UI has settled
      const timer = setTimeout(() => {
        resetPreventModalReopen();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [preventModalReopen, resetPreventModalReopen]);

  const handleAddActivity = async (
    activityData: Omit<Activity, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    try {
      // Set local ref to prevent reopening
      modalJustClosed.current = true;

      await addActivity(id, activityData);
      // Don't return a boolean
    } catch (error) {
      console.error("Error adding activity:", error);
    }
  };

  const handleEditActivity = async (
    activityData: Omit<Activity, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    if (!editingActivity) return;

    try {
      // Set local ref to prevent reopening
      modalJustClosed.current = true;

      await editActivity(id, editingActivity._id, activityData);
      // Don't return a boolean
    } catch (error) {
      console.error("Error editing activity:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteActivityId) return;
    setIsDeleting(true);
    await deleteActivity(id, deleteActivityId);
    setIsDeleting(false);
    setDeleteActivityId(null);
  };

  const handleEditClick = (activity: Activity) => {
    if (!isOperationInProgress && !preventModalReopen) {
      setEditingActivity(activity);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteClick = (activityId: string) => {
    if (!isOperationInProgress && !preventModalReopen) {
      setDeleteActivityId(activityId);
    }
  };

  // Clear editing state and ensure modals stay closed
  const handleModalClose = () => {
    if (!isOperationInProgress) {
      setIsModalOpen(false);
      setIsEditModalOpen(false);
      setEditingActivity(null);
    }
  };

  // Open "Add" modal only if safe to do so
  const handleAddClick = () => {
    if (!isOperationInProgress && !preventModalReopen) {
      setIsModalOpen(true);
    }
  };

  if (isLoading && !isOperationInProgress) {
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
        <Button
          onClick={handleAddClick}
          disabled={isOperationInProgress || preventModalReopen}
        >
          Add Activity
        </Button>
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
                  disabled={isOperationInProgress || preventModalReopen}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(activity._id)}
                  disabled={isOperationInProgress || preventModalReopen}
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
          <Button
            onClick={handleAddClick}
            className="mt-2"
            disabled={isOperationInProgress || preventModalReopen}
          >
            Add Your First Activity
          </Button>
        </div>
      )}

      {/* Only render the modal when it's actually needed */}
      {isModalOpen && !preventModalReopen && (
        <AddEditActivityModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleAddActivity}
          prospectId={id}
        />
      )}

      {isEditModalOpen && !preventModalReopen && (
        <AddEditActivityModal
          isOpen={isEditModalOpen}
          onClose={handleModalClose}
          onSave={handleEditActivity}
          prospectId={id}
          initialData={editingActivity || undefined}
          mode="edit"
        />
      )}

      <AlertDialog
        open={!!deleteActivityId}
        onOpenChange={(open) =>
          !isOperationInProgress && !open && setDeleteActivityId(null)
        }
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
            <AlertDialogCancel
              onClick={() => setDeleteActivityId(null)}
              disabled={isDeleting || isOperationInProgress}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting || isOperationInProgress}
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
