"use client";

import React, { useState, useEffect } from "react";
import { Reminder, ReminderStatus } from "@/types/reminder";
import AddEditReminderModal from "@/components/salesperson/AddEditReminderModal";
import {
  Bell,
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

function getStatusVariant(status: ReminderStatus) {
  switch (status) {
    case ReminderStatus.SENT:
      return "default";
    case ReminderStatus.CANCELLED:
      return "destructive";
    default:
      return "secondary";
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RemindersPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deleteReminderId, setDeleteReminderId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchReminders = React.useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch(`/api/prospects/${id}/reminders`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch reminders");
      }
      const remindersData = await response.json();
      setReminders(remindersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Failed to load reminders");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchReminders();
    }
  }, [id, fetchReminders]);

  const handleAddReminder = async (
    reminder: Omit<Reminder, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    try {
      const response = await fetch(`/api/prospects/${id}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reminder,
          dueDate: reminder.dueDate.toISOString(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add reminder");
      }
      setIsModalOpen(false);
      await fetchReminders();
    } catch (err) {
      console.error("Error adding reminder:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add reminder"
      );
    }
  };

  const handleDeleteClick = (reminderId: string) => {
    setDeleteReminderId(reminderId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteReminderId) return;

    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting reminder...");

    try {
      const response = await fetch(
        `/api/prospects/${id}/reminders/${deleteReminderId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete reminder");
      }

      setReminders((prevReminders) =>
        prevReminders.filter((reminder) => reminder._id !== deleteReminderId)
      );
      toast.success("Reminder removed successfully", {
        id: loadingToast,
      });
    } catch (err) {
      console.error("Error deleting reminder:", err);
      toast.error("Failed to delete reminder", {
        id: loadingToast,
      });
      fetchReminders();
    } finally {
      setIsDeleting(false);
      setDeleteReminderId(null);
    }
  };

  const handleEditClick = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsEditModalOpen(true);
  };

  const handleEditReminder = async (
    reminder: Omit<Reminder, "_id" | "createdAt" | "updatedAt" | "addedBy">
  ) => {
    if (!editingReminder) return;
    try {
      const response = await fetch(
        `/api/prospects/${id}/reminders/${editingReminder._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...reminder,
            dueDate: reminder.dueDate.toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update reminder");
      }

      setIsEditModalOpen(false);
      setEditingReminder(null);
      await fetchReminders();
    } catch (err) {
      console.error("Error updating reminder:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update reminder"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-6 space-y-4 sm:space-y-6">
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
        <AlertTitle>Error Loading Reminders</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReminders}
          className="mt-2"
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
          <h1 className="text-base sm:text-lg font-medium">Reminders</h1>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="h-8 sm:h-9"
        >
          Add Reminder
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reminders.map((reminder) => (
          <Card
            key={reminder._id}
            className="overflow-hidden border-border/5 bg-card shadow-none"
          >
            <CardHeader className="border-b border-border/5 bg-card p-3">
              <div className="relative flex flex-col w-full">
                <div className="flex items-start justify-between w-full">
                  <h3 className="text-sm font-medium text-card-foreground break-all pr-16">
                    {reminder.title}
                  </h3>
                  <div className="flex items-start gap-1 absolute right-0 top-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteClick(reminder._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                      onClick={() => handleEditClick(reminder)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Badge
                  variant={getStatusVariant(reminder.status)}
                  className="mt-1.5 w-fit text-[10px] font-normal"
                >
                  {reminder.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 bg-card p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">
                  Due: {formatDate(reminder.dueDate)}
                </span>
              </div>
              {reminder.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                  <span className="text-xs text-muted-foreground truncate">
                    Completed: {formatDate(reminder.completedAt)}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground break-words leading-relaxed">
                {reminder.description}
              </p>
            </CardContent>
          </Card>
        ))}

        {reminders.length === 0 && (
          <Card className="col-span-full border-border/5 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-primary/20" />
              <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-medium text-card-foreground">
                No reminders yet
              </h3>
              <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-center text-muted-foreground max-w-[240px]">
                Get started by adding a new reminder.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="h-8 sm:h-9"
              >
                Add First Reminder
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AddEditReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddReminder}
        prospectId={id}
      />

      <AddEditReminderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleEditReminder}
        prospectId={id}
        initialData={editingReminder || undefined}
        mode="edit"
      />

      <AlertDialog
        open={!!deleteReminderId}
        onOpenChange={() => setDeleteReminderId(null)}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              reminder.
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
